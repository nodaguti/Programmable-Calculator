var head;
var machine = new Machine();

function init(){
    //automatic parsing
    $('#source').on('blur keyup', function(){ parse(); });

    //run
    $('.btn-run').on('click', function(){ run(); });

    //clear source code
    $('.btn-clear').on('click', function(){
        if(!$('#source').val()) return;

        bootbox.confirm('本当にソースコードを消去しますか？', function(result){
            if(!result) return;

            $('#source').val('').trigger('keyup');
        });
    });

    //reset env
    $('.btn-reset').on('click', function(){
        bootbox.confirm('本当に環境をリセットしますか？', function(result){
            if(!result) return;

            machine.globalScope.functions = {};
            machine.globalScope.variables = {};

            updateFunctionTable();
            updateVariableTable();
        });
    });

    //load env
    $('.btn-load').on('click', function(){
        $('#dialog-load').modal('show');
    });

    //save env
    $('.btn-save').on('click', function(){
        saveEnvironment();
    });

    //edit variable
    $('.variable-table-content').on('click', '.btn-edit', function(ev){
        editVariable(ev.target.parentNode.parentNode.dataset.name);
    });

    //delete variable
    $('.variable-table-content').on('click', '.btn-delete', function(ev){
        deleteVariable(ev.target.parentNode.parentNode.dataset.name);
    });

    //edit function
    $('.function-table-content').on('click', '.btn-edit', function(ev){
        editFunction(ev.target.parentNode.parentNode.dataset.name);
    });

    //delete function
    $('.function-table-content').on('click', '.btn-delete', function(ev){
        deleteFunction(ev.target.parentNode.parentNode.dataset.name);
    });


    initDropbox();
    parse();
}


function initDropbox(){
    var modal = $('#dialog-load');

    $(document).on('dragenter dragover dragend dragleave', function(event){
        event.preventDefault();
    });

    $(document).on('drop', function(event){
        event.preventDefault();
        modal.modal('hide');
        loadEnvironment(event.originalEvent.dataTransfer.files);
    });

    modal.find('.btn-load').on('click', function(event){
        event.preventDefault();
        modal.find('.dialog-load-file-input').click();
    });

    modal.find('.dialog-load-file-input').on('change', function(event){
        modal.modal('hide');
        loadEnvironment(event.target.files);
    });
}


function loadEnvironment(files){
    var file = files[0];
    var reader = new FileReader();

    reader.onerror = function(event){
        bootbox.alert('ファイルの読み込みに失敗しました.\n\n' + event.target.error);
    };

    reader.onload = function(event){
        var envData = event.target.result;
        envData = envData.split('/* ***** /SOURCE CODE BLOCK ***** */');

        var sourceCode = envData[0].replace('/* ***** SOURCE CODE BLOCK ***** */\n', '');
        var declarations = envData[1];

        if(! /^\n*$/.test(sourceCode)){
            $('#source').val(sourceCode);
        }

        run(declarations, true);

        bootbox.alert('環境の読み込みが完了しました.');
    };

    reader.readAsText(file, 'utf-8');
}


function saveEnvironment(){
    var message = $('<div>保存する対象を選択してください(複数選択可).</div>' +
                    '<select multiple class="form-control">' +
                        '<option value="source">ソースコード</option>' +
                        '<option value="variables">変数</option>' +
                        '<option value="functions">関数</option>' +
                    '</select>');

    bootbox.dialog({
        title: '環境の保存',

        message: message,

        backdrop: true,

        buttons: {
            cancel: {
                className: 'btn-default',
                callback: function(){}
            },

            success: {
                label: 'Save',

                className: 'btn-primary',

                callback: function(){
                    var selected = $(message[1]).val();
                    var exportData = '';

                    exportData += '/* ***** SOURCE CODE BLOCK ***** */\n';

                    if(selected.indexOf('source') !== -1){
                        exportData += $('#source').val() + '\n';
                    }

                    exportData += '/* ***** /SOURCE CODE BLOCK ***** */\n\n';


                    if(selected.indexOf('variables') !== -1){
                        for(var name in machine.globalScope.variables){
                            if(!machine.globalScope.variables.hasOwnProperty(name)) continue;

                            var value = machine.globalScope.variables[name];

                            exportData += (new NodeAssign({
                                left: new NodeVariable({ value: name }),
                                right: new NodeNumber({ value: value })
                            })).toString() + '\n';
                        }
                    }

                    if(selected.indexOf('functions') !== -1){
                        for(var name in machine.globalScope.functions){
                            if(!machine.globalScope.functions.hasOwnProperty(name)) continue;

                            var func = machine.globalScope.functions[name];
                            exportData += '\n' + func.toString() + '\n';
                        }
                    }

                    var url = "data:application/octet-stream," + encodeURIComponent(exportData);
                    var downloadBtn = '<a href="' + url + '"' +
                                         'download="programmable-calculator-' + Date.now() + '.env' +
                                         '" class="btn btn-primary center-block">データのダウンロード</a>';

                    bootbox.alert(downloadBtn);
                }
            }
        }
    });
}


function editVariable(name){
    bootbox.prompt('新しい ' + name + ' の値を入力してください', function(result){
        if(!result) return;

        machine.setVariable(name, result - 0);
        updateVariableTable();
    });
}


function deleteVariable(name){
    bootbox.confirm(name + ' を本当に削除しますか？', function(result){
        if(!result) return;

        delete machine.globalScope.variables[name];
        updateVariableTable();
    });
}


function editFunction(name){
    var textarea = $('<textarea class="form-control function-edit-textarea" rows="10">' +
                                machine.globalScope.functions[name].toString() + '</textarea>');

    bootbox.dialog({
        title: name + ' の新しい定義を入力してください',

        message: textarea,

        backdrop: true,

        buttons: {
            cancel: {
                className: 'btn-default',
                callback: function(){}
            },

            success: {
                label: 'OK',

                className: 'btn-primary',

                callback: function(){
                    run(textarea.val(), true);
                }
            }
        }
    });
}


function deleteFunction(name){
    bootbox.confirm(name + ' を本当に削除しますか？', function(result){
        if(!result) return;

        delete machine.globalScope.functions[name];
        updateFunctionTable();
    });
}



function parse(source){
    head = new NodeNoop({});

    source = source || $('#source').val();

    try{
        parser.parse(source);
        $('#parse-result').text('No Error.');
        $('.btn-run').removeAttr('disabled');
    }catch(ex){
        $('#parse-result').text(ex, 'alert alert-danger');
        $('.btn-run').attr('disabled', 'disabled');
        console.error(ex);
    }

    updateParseTree();
}


function run(source, silent){
    parse(source);

    try{
        //make sure the scope is enabled.
        machine.flags.enableScope = true;

        //run
        machine.run(head, true);

        var result = machine.valueStack.pop();

        if(!silent){
            pushHistory(result);
        }
    }catch(ex){
        pushHistory('Line ' + (ex.lineNumber || 0) + ': ' + ex.message + '<br/><br/>' +
                    '<b>Code</b><br/>> <i>' + ex.line + '</i><br/><br/>' +
                    '<b>Stacktrace</b> (Limited only top 5)<br/>' + ex.stacktrace.split('\n').slice(0, 5).join('<br/>'),
                    'alert alert-danger');
        console.error(ex);

        machine._init();
    }

    updateVariableTable();
    updateFunctionTable();
}


function pushHistory(msg, type){
    type = type || 'well well-sm';

    $('<div class="' + type + '">' +
        '<div class="result-header"><small>' + (new Date()).toLocaleString() + '</small></div>' +
        '<div class="result-body">' + msg + '</div>' +
    '</div>')
    .insertAfter($('.results-container > h4'));
}


function updateFunctionTable(){
    var root = $('.function-table-content');

    root.empty();

    for(var name in machine.globalScope.functions){
        if(!machine.globalScope.functions.hasOwnProperty(name)) continue;

        var func = machine.globalScope.functions[name];
        var args = func.parameters.map(function(param){
            return param ? param.value: '';
        }).join(', ');

        $('<tr data-toggle="tooltip" data-placement="left"' +
               'data-name="' + func.value + '" title="' +
                    func.toString().replace(/\n/g, '<br/>')
                                   .replace(/\s/g, '&nbsp;') +
                '">' +
                '<td>' + func.value + '</td><td>' + args + '</td>' +
                '<td class="controls-container">' +
                    '<button type="button" class="btn btn-default btn-edit">Edit</button>' +
                    '<button type="button" class="btn btn-danger btn-delete">Delete</button>' +
                '</td>' +
        '</tr>').appendTo(root);
    }

    root.find('tr').tooltip({ html: true });
}


function updateVariableTable(){
    var root = $('.variable-table-content');

    root.empty();

    for(var name in machine.globalScope.variables){
        if(!machine.globalScope.variables.hasOwnProperty(name)) continue;

        var value = machine.globalScope.variables[name];

        $('<tr data-name="' + name + '">' +
            '<td>' + name + '</td><td>' + value + '</td>' +
            '<td class="controls-container">' +
                '<button type="button" class="btn btn-default btn-edit">Edit</button>' +
                '<button type="button" class="btn btn-danger btn-delete">Delete</button>' +
            '</td>' +
        '</tr>').appendTo(root);
    }
}


function updateParseTree(){
    var treeData = _createParseTree(head.next);
    var container = $('.parse-tree-container');

    if(container.html()){
        container.tree('loadData', treeData);
    }else{
        container.tree({
            data: treeData,
            autoOpen: true
        });
    }
}


function _createParseTree(currentNode){
    if(!currentNode) return [];

    var dataArray = [];
    var data = {
        label: currentNode.label,
        children: []
    };

    if(currentNode.value || currentNode.value === 0){
        data.children.push({
            label: '[value]',
            children:
                currentNode.value instanceof Node ?
                    _createParseTree(currentNode.value) :
                    [ { label: currentNode.value } ]
        });
    }

    if(currentNode.left || currentNode.left === 0){
        data.children.push({
            label: '[left]',
            children:
                currentNode.left instanceof Node ?
                    _createParseTree(currentNode.left) :
                    [ { label: currentNode.left } ]
        });
    }

    if(currentNode.right || currentNode.right === 0){
        data.children.push({
            label: '[right]',
            children:
                currentNode.right instanceof Node ?
                    _createParseTree(currentNode.right) :
                    [ { label: currentNode.right } ]
        });
    }

    if(currentNode.children.length > 2){
        var _data = {
            label: '[children]',
            children: []
        };

        data.children.push(_data);

        currentNode.children.forEach(function(child){
            if(child === undefined || child === null) return;

            _data.children = _data.children.concat(
                child instanceof Node ? _createParseTree(child) :
                                        [ { label: child } ]
            );
        });
    }

    if(currentNode.parameters){
        var _data = {
            label: '[parameters]',
            children: []
        };

        data.children.push(_data);

        currentNode.parameters.forEach(function(param){
            if(!param) return;

            _data.children = _data.children.concat(_createParseTree(param));
        });
    }

    if(currentNode.body){
        data.children.push({
            label: '[body]',
            children: _createParseTree(currentNode.body)
        });
    }


    dataArray.push(data);

    if(currentNode.next){
        dataArray = dataArray.concat(_createParseTree(currentNode.next));
    }

    return dataArray;
}


init();
