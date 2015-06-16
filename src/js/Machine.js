function Machine(){
    this._init(this, arguments);
}

Machine.prototype = {

    /**
     * 実行時フラグ
     */
    flags: {

        /**
         * スコープを有効にするか否か
         */
        enableScope: true

    },


    /**
     * 戻り値などを記録するスタック
     */
    valueStack: null,


    /**
     * スコープを管理するためのスタック
     */
    scopeStack: null,


    /**
     * プログラムスタック
     */
    programStack: null,


    /**
     * グローバルスコープへのシンタックスシュガー
     */
    get globalScope(){
        return this.scopeStack[0];
    },



    _init: function(){
        this.valueStack = [];
        this.programStack = [];
        this.scopeStack = [];

        //create global scope
        this._createScope();
    },


    run: function(head, isGlobal){
        if(!isGlobal && this.flags.enableScope){
            this._createScope();
        }

        this.current = head;

        try{

            program_loop:

            do{
                switch(this.current.label){

                    case 'if':
                        var isTrue = this.current.evaluate();

                        this.programStack.push(this.current);

                        if(isTrue){
                            this.run(this.current.left);
                        }else if(this.current.right){
                            this.run(this.current.right);
                        }

                        this.current = this.programStack.pop();
                        this.value = this.valueStack.pop();

                        break;


                    case 'while':
                        while(this.current.evaluate()){
                            this.programStack.push(this.current);

                            this.run(this.current.body);

                            this.current = this.programStack.pop();
                            this.value = this.valueStack.pop();
                        }

                        break;


                    case 'function-call':
                        this.value = this.current.evaluate();
                        break;


                    case 'function-return':
                        this.value = this.current.evaluate();
                        console.log('return:', this.value);

                        break program_loop;


                    default:
                        var tmp = this.current.evaluate();
                        this.value = tmp !== undefined ? tmp : this.value;
                        break;

                }


                console.log((this.current.lineNumber+1) + ': [' + this.current.label + '] ' + this.value);

            }while(this.current = this.current.next);

        }catch(ex){
            //実行時エラーの処理

            if(this.current.lineNumber !== undefined){
                ex.lineNumber = this.current.lineNumber + 1;
            }

            ex.line = this.current.toString().split('\n')[0];

            ex.stacktrace = this.programStack.map(function(node){
                return 'Line ' + (node.lineNumber + 1) + ': ' + node.toString().split('\n')[0];
            }).reverse().join('\n');

            throw ex;
        }


        if(!isGlobal && this.flags.enableScope){
            this._discardScope();
        }

        this.valueStack.push(this.value);
    },


    call: function(funcName, args){
        console.log("call function:", funcName, "with args:", args);

        if(PredefinedFunctions[funcName] !== undefined){

            return PredefinedFunctions[funcName].apply(this, args);

        }else{
            for(var i = this.scopeStack.length - 1; i >= 0; i--){
                var scope = this.scopeStack[i];

                if(scope.functions[funcName] !== undefined){
                    var funcHead = scope.functions[funcName];
                    funcHead.setArguments(args);

                    this.programStack.push(this.current);

                    this.run(funcHead.body);

                    this.current = this.programStack.pop();

                    return this.valueStack.pop();
                }
            }

            throw new Error('Function ' + funcName + ' is undefined.');
        }

    },


    _createScope: function(){
        this.scopeStack.push({
            functions: {},
            variables: {}
        });
    },


    _discardScope: function(){
        this.scopeStack.pop();
    },


    setVariable: function(name, value, isArgument){
        if(PredefinedConsts[name] !== undefined){
            throw new Error('Const ' + name + ' is read-only.');
        }else{
            if(!isArgument){
                for(var i = this.scopeStack.length - 1; i >= 0; i--){
                    var scope = this.scopeStack[i];

                    if(scope.variables[name] !== undefined){
                        return scope.variables[name] = value;
                    }
                }
            }

            //allocate a new variable in the closest scope
            this.scopeStack[this.scopeStack.length - 1].variables[name] = value;
        }
    },


    getVariable: function(name){
        if(PredefinedConsts[name] !== undefined){

            return PredefinedConsts[name];

        }else{
            for(var i = this.scopeStack.length - 1; i >= 0; i--){
                var scope = this.scopeStack[i];

                if(scope.variables[name] !== undefined){
                    return scope.variables[name];
                }
            }

            throw new Error('Variable ' + name + ' is undefined.');
        }
    },


    registerFunction: function(funcNode){
        for(var i = this.scopeStack.length - 1; i >= 0; i--){
            var scope = this.scopeStack[i];

            if(scope.functions[funcNode.value] !== undefined){
                return scope.functions[funcNode.value] = funcNode;
            }
        }

        //allocate a new function in the closest scope
        this.scopeStack[this.scopeStack.length - 1].functions[funcNode.value] = funcNode;
    }

};
