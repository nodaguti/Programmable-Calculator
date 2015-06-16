/**
 * ノードを表すクラス
 * @abstract
 */
function Node(){
    this._init.apply(this, arguments);
}

Node.prototype = {

    machine: null,

    get left(){
        return this.children[0];
    },

    set left(value){
        this.children[0] = value;
    },

    get right(){
        return this.children[1];
    },

    set right(value){
        this.children[1] = value;
    },

    get tail(){
        var c = this;

        while(c.next){
            c = c.next;
        }

        return c;
    },


    /**
     * 子要素
     */
    children: null,

    /**
     * ノードの値
     */
    value: null,

    /**
     * 次のノード
     */
    next: null,

    /**
     * ノードの種類を表す文字列
     */
    label: '',

    /**
     * コードの行数を表す
     */
    lineNumber: 0,


    /**
     * 初期化処理
     */
    _init: function(arg){
        this.children = arg.children || [];

        if(arg.left !== undefined) this.left = arg.left;
        if(arg.right !== undefined) this.right = arg.right;
        if(arg.value !== undefined) this.value = arg.value;
        if(arg.lineNumber !== undefined) this.lineNumber = arg.lineNumber;
    },


    /**
     * ノードの評価処理
     */
    evaluate: function(){},


    /**
     * ノードの文字列化
     */
    toString: function(){}
};



/**
 * 何もしない命令
 */
function NodeNoop(){
    Node.apply(this, arguments);
}

NodeNoop.prototype = Object.create(Node.prototype, {

    label: {
        value: 'noop'
    },

    evaluate: {
        value: function(){
        }
    },

    toString: {
        value: function(){
            return '' + (this.next ? this.next.toString() : '');
        }
    }
});

NodeNoop.constructor = NodeNoop;



function NodeNumber(){
    Node.apply(this, arguments);
}

NodeNumber.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'number'
    },

    evaluate: {
        value: function(){
            return Number(this.value);
        }
    },

    toString: {
        value: function(){
            return this.value + (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeNumber.constructor = NodeNumber;



function NodeVariable(){
    Node.apply(this, arguments);
}

NodeVariable.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'variable'
    },

    evaluate: {
        value: function(){
            return machine.getVariable(this.value);
        }
    },

    toString: {
        value: function(){
            return this.value + (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeVariable.constructor = NodeVariable;



function NodeAssign(){
    Node.apply(this, arguments);
}

NodeAssign.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'assign'
    },

    evaluate: {
        value: function(){
            var value = this.right.evaluate();
            machine.setVariable(this.left.value, value);
            return value;
        }
    },

    toString: {
        value: function(){
            return this.left.value + ' = ' + this.right.toString() + ';' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeAssign.constructor = NodeAssign;



function NodeArgAssign(){
    Node.apply(this, arguments);
}

NodeArgAssign.prototype = Object.create(NodeAssign.prototype, {

    label: {
        value: 'argument-assign'
    },

    evaluate: {
        value: function(){
            var value = this.right.evaluate();
            machine.setVariable(this.left.value, value, true);
            return value;
        }
    },

    toString: {
        value: function(){
            return '' + (this.next ? this.next.toString() : '');
        }
    }
});

NodeArgAssign.constructor = NodeArgAssign;



function NodePlus(){
    Node.apply(this, arguments);
}

NodePlus.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'plus'
    },

    evaluate: {
        value: function(){
            return this.left.evaluate() + this.right.evaluate();
        }
    },

    toString: {
        value: function(){
            return '(' + this.left.toString() + ' + ' + this.right.toString() + ')' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodePlus.constructor = NodePlus;



function NodeMinus(){
    Node.apply(this, arguments);
}

NodeMinus.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'minus'
    },

    evaluate: {
        value: function(){
            return this.left.evaluate() - this.right.evaluate();
        }
    },

    toString: {
        value: function(){
            return '(' + this.left.toString() + ' - ' + this.right.toString() + ')' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeMinus.constructor = NodeMinus;



function NodeMul(){
    Node.apply(this, arguments);
}

NodeMul.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'multiply'
    },

    evaluate: {
        value: function(){
            return this.left.evaluate() * this.right.evaluate();
        }
    },

    toString: {
        value: function(){
            return '(' + this.left.toString() + ' * ' + this.right.toString() + ')' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeMul.constructor = NodeMul;



function NodeDiv(){
    Node.apply(this, arguments);
}

NodeDiv.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'div'
    },

    evaluate: {
        value: function(){
            var left = this.left.evaluate();
            var right = this.right.evaluate();

            //zero-division guard
            if(right === 0){
                throw new Error('Division by zero.');
            }

            return left / right;
        }
    },

    toString: {
        value: function(){
            return '(' + this.left.toString() + ' / ' + this.right.toString() + ')' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeDiv.constructor = NodeDiv;



function NodeMod(){
    Node.apply(this, arguments);
}

NodeMod.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'mod'
    },

    evaluate: {
        value: function(){
            return this.left.evaluate() % this.right.evaluate();
        }
    },

    toString: {
        value: function(){
            return '(' + this.left.toString() + ' % ' + this.right.toString() + ')' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeMod.constructor = NodeMod;



function NodePower(){
    Node.apply(this, arguments);
}

NodePower.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'power'
    },

    evaluate: {
        value: function(){
            return Math.pow(this.left.evaluate(), this.right.evaluate());
        }
    },

    toString: {
        value: function(){
            return '(' + this.left.toString() + ' ^ ' + this.right.toString() + ')' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodePower.constructor = NodePower;



function NodeFactorial(){
    Node.apply(this, arguments);
}

NodeFactorial.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'factorial'
    },

    _factorial: {
        value: function(n){
            return n == 1 ? 1 : n * this._factorial(n-1);
        }
    },

    evaluate: {
        value: function(){
            var value = this.value.evaluate();

            if(value <= 0){
                return 1;
            }else{
                return this._factorial(value);
            }
        }
    },

    toString: {
        value: function(){
            return '(' + this.value.toString() + '!' + ')' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeFactorial.constructor = NodeFactorial;



function NodeRelation(){
    Node.apply(this, arguments);
}

NodeRelation.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'relation'
    },

    evaluate: {
        value: function(){
            var left = this.left.evaluate();
            var right = this.right.evaluate();

            switch(this.value){

                case '&&':
                    return left && right;

                case '||':
                    return left || right;

                default:
                    throw new Error('Invalid type of relational operation.', this.value);

            }
        }
    },

    toString: {
        value: function(){
            return this.left.toString() + ' ' + this.value + ' ' + this.right.toString() +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeRelation.constructor = NodeRelation;



function NodeMagnitudeRelation(){
    Node.apply(this, arguments);
}

NodeMagnitudeRelation.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'magnitude-relation'
    },

    evaluate: {
        value: function(){
            var left = this.left.evaluate();
            var right = this.right.evaluate();

            switch(this.value){

                case '>=':
                    return left >= right;

                case '>':
                    return left > right;

                case '<=':
                    return left <= right;

                case '<':
                    return left < right;

                case '==':
                    return left === right;

                case '!=':
                    return left !== right;

                default:
                    throw new Error('Invalid type of magnitude relational operation.', this.value);

            }
        }
    },

    toString: {
        value: function(){
            return this.left.toString() + ' ' + this.value + ' ' + this.right.toString() +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeMagnitudeRelation.constructor = NodeMagnitudeRelation;


function NodeIf(){
    Node.apply(this, arguments);
}

NodeIf.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'if'
    },

    evaluate: {
        value: function(){
            return this.value.evaluate();
        }
    },

    toString: {
        value: function(){
            return 'if( ' + this.value.toString() + ' ) {\n' +
                        this.left.toString().replace(/^/gm, '    ') +
                    '\n}' +
                    (this.right ? 'else{\n' +
                        this.right.toString().replace(/^/gm, '    ') +
                    '\n}' : '') +
                    (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeIf.constructor = NodeIf;


function NodeWhile(){
    Node.apply(this, arguments);
}

NodeWhile.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'while'
    },

    _init: {
        value: function(data){
            Node.prototype._init.apply(this, arguments);
            this.body = data.body;
        }
    },

    evaluate: {
        value: function(){
            return this.value.evaluate();
        }
    },

    toString: {
        value: function(){
            return 'while( ' + this.value.toString() + ' ) {\n' +
                        this.body.toString().replace(/^/gm, '    ') +
                    '\n}' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeWhile.constructor = NodeWhile;



/**
 * 関数の先頭を表す
 * value: 関数名
 */
function NodeFunction(){
    Node.apply(this, arguments);
}

NodeFunction.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'function'
    },

    _init: {
        value: function(data){
            Node.prototype._init.apply(this, arguments);
            this.parameters = data.parameters;
            this.body = data.body;

            //create nodes which assign arguments
            this.parameters.forEach(function(param){
                var assignNode = new NodeArgAssign({ left: param, right: new NodeNumber({})});

                assignNode.next = this.body;
                this.body = assignNode;
            }, this);
        }
    },

    setArguments: {
        value: function(args){
            //引数の数をチェック
            if(this.parameters.length > args.length){
                throw new Error('Not enough arguments to ' + this.value + '.');
            }else if(this.parameters.length < args.length){
                throw new Error('Too many arguments to ' + this.value + '.');
            }

            //引数を設定
            args.reverse().forEach(function(arg, index){
                var assignNode = this.body;

                for(var i = 0; i < index; i++){
                    assignNode = assignNode.next;
                }

                assignNode.right.value = arg;
            }, this);
        }
    },

    toString: {
        value: function(){
            return 'function ' + this.value + '(' +
                        this.parameters.map(function(param){
                            return param ? param.value : '';
                        }).join(', ') +
                    ') {\n' +
                        this.body.toString().replace(/^/gm, '    ') +
                    '\n}' +
                    (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeFunction.constructor = NodeFunction;



function NodeFunctionDeclaration(){
    Node.apply(this, arguments);
}

NodeFunctionDeclaration.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'function-declaration'
    },

    evaluate: {
        value: function(){
            machine.registerFunction(this.value);
            return 0;
        }
    },

    toString: {
        value: function(){
            return this.value.toString() + (this.next ? '\n' + this.next.toString() : '');
        }
    }

});

NodeFunctionDeclaration.constructor = NodeFunctionDeclaration;



/**
 * 関数呼び出し
 * value: 呼び出し先関数名
 * children: 実引数
 */
function NodeFunctionCall(){
    Node.apply(this, arguments);
}

NodeFunctionCall.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'function-call'
    },

    evaluate: {
        value: function(){
            var args = this.children.map(function(arg){
                return arg && arg.evaluate();
            }).filter(function(item){ return item !== undefined; });

            return machine.call(this.value, args);
        }
    },

    toString: {
        value: function(){
            return 'call ' + this.value + ' ' +
                    this.children.map(function(arg){ return arg ? arg.toString() : ''; }).join(' ') +
                    (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeFunctionCall.constructor = NodeFunctionCall;



function NodeReturn(){
    Node.apply(this, arguments);
}

NodeReturn.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'function-return'
    },

    evaluate: {
        value: function(){
            return this.value.evaluate();
        }
    },

    toString: {
        value: function(){
            return 'return ' + this.value.toString() + ';' +
                   (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeReturn.constructor = NodeReturn;



function NodeCommand(){
    Node.apply(this, arguments);
}

NodeCommand.prototype = Object.create(NodeNoop.prototype, {

    label: {
        value: 'command'
    },

    evaluate: {
        value: function(){
            switch(true){

                case this.value.indexOf('enable scope') !== -1:
                case this.value.indexOf('enable local variable') !== -1:
                    machine.flags.enableScope = true;
                    break;

                case this.value.indexOf('disable scope') !== -1:
                case this.value.indexOf('disable local variable') !== -1:
                    machine.flags.enableScope = false;
                    break;

                default:
                    throw new Error('Unknown command: ' + this.value);

            }
        }
    },

    toString: {
        value: function(){
            return this.value + (this.next ? '\n' + this.next.toString() : '');
        }
    }
});

NodeCommand.constructor = NodeCommand;
