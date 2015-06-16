/* lexical grammar */
%lex
%%

\s+               /* skip whitespace */
"/*".*"*/"          return 'COMMENT'
"//".*[\n\r]        return 'COMMENT'

[0-9]+("."[0-9]+)?  return 'NUMBER'

"=="                return 'MAG_RELATION'
"!="                return 'MAG_RELATION'
">="                return 'MAG_RELATION'
"<="                return 'MAG_RELATION'
">"                 return 'MAG_RELATION'
"<"                 return 'MAG_RELATION'
"&&"                return 'RELATION'
"||"                return 'RELATION'

"*"                 return '*'
"/"                 return '/'
"-"                 return '-'
"+"                 return '+'
"^"                 return '^'
"!"                 return '!'
"%"                 return '%'

"("                 return '('
")"                 return ')'
"{"                 return '{'
"}"                 return '}'
","                 return ','
"="                 return '='
":"                 return ':'
";"                 return ';'

"function"          return 'FUNCTION'
"var"               return 'VAR'
"if"                return 'IF'
"else"              return 'ELSE'
"return"            return 'RETURN'
"while"             return 'WHILE'
"call"              return 'CALL'

[a-zA-Z_]\w*        return 'IDENTIFIER'

<<EOF>>             return 'EOF'
.                   return 'INVALID'

/lex


/* operators */

%left '+' '-'
%left '*' '/'
%left '>' '>=' '<' '<=' '==' '!='
%left '&&' '||'
%left '^'
%right '!'
%right '%'
%left UMINUS


/* start symbol */
%start program


/* language grammar */
%%

program
    : EOF { $$ = head; }
    | program_source EOF { head.next = $1 }
    ;

program_source
    : program_body { $$ = $1; }
    | program_source program_body { $1.tail.next = $2; $$ = $1; }
    ;

program_body
    : block { $$ = $1; }
    | program_body block { $1.tail.next = $2; $$ = $1; }
    ;

block
    : if_block
    | while_block
    | function_declaration
    | line
    | COMMENT {
        if($1.lastIndexOf('/*!', 0) === 0){
            $$ = new NodeCommand({ value: $1, lineNumber: yylineno });
        }else{
            $$ = new NodeNoop({});
        }
    }
    ;

line
    : statement
    | expression
    | line ';' { $$ = $1; }
    ;

statement
    : variable_assignment
    | return_statement
    ;


function_declaration
    : FUNCTION IDENTIFIER '(' ')' '{' program_body '}' {
        var funcNode = new NodeFunction({
            value: $2,
            parameters: [],
            body: $6,
            lineNumber: yylineno
        });

        $$ = new NodeFunctionDeclaration({ value: funcNode, lineNumber: yylineno });
    }
    | FUNCTION IDENTIFIER '(' function_parameter ')' '{' program_body '}' {
        var funcNode = new NodeFunction({
            value: $2,
            parameters: $4,
            body: $7,
            lineNumber: yylineno
        });

        $$ = new NodeFunctionDeclaration({ value: funcNode, lineNumber: yylineno });
    }
    ;

function_parameter
    : variable_identifier { $$ = [ $1 ]; }
    | function_parameter ',' variable_identifier { if($3) $1.push($3); $$ = $1; }
    ;

function_call
    : CALL IDENTIFIER { $$ = new NodeFunctionCall({ value: $2, lineNumber: yylineno }); }
    | function_call expression { $1.children.push($2); $$ = $1; }
    ;


variable_assignment
    : variable_identifier '=' expression { $$ = new NodeAssign({ left: $1, right: $3, lineNumber: yylineno }); }
    ;

variable_identifier
    : IDENTIFIER { $$ = new NodeVariable({ value: $1, lineNumber: yylineno }); }
    ;


if_block
    : if_true_block { $$ = $1; }
    | if_true_block if_else_block { $1.right = $2; $$ = $1; }
    ;

if_true_block
    : IF '(' boolean_expression ')' '{' program_body '}' {
        $$ = new NodeIf({ value: $3, left: $6, lineNumber: yylineno });
    }
    ;

if_else_block
    : ELSE '{' program_body '}' { $$ = $3; }
    ;

while_block
    : WHILE '(' boolean_expression ')' '{' program_body '}' {
        $$ = new NodeWhile({ value: $3, body: $6, lineNumber: yylineno });
    }
    ;

return_statement
    : RETURN expression { $$ = new NodeReturn({ value: $2, lineNumber: yylineno }); }
    ;


expression
    : simple_expression
    | boolean_expression
    ;

boolean_expression
    : binary_boolean_expression
    | boolean_expression RELATION boolean_expression {
        $$ = new NodeRelation({ value: $2, left: $1, right: $3, lineNumber: yylineno });
    }
    | '(' boolean_expression ')' { $$ = $2; }
    ;

binary_boolean_expression
    : simple_expression MAG_RELATION simple_expression {
        $$ = new NodeMagnitudeRelation({ value: $2, left: $1, right: $3, lineNumber: yylineno });
    }
    | '(' binary_boolean_expression ')' { $$ = $2; }
    ;

simple_expression
    : primary
    | '-' simple_expression %prec UMINUS  {
        var zero = new NodeNumber({ value: 0, lineNumber: yylineno });
        $$ = new NodeMinus({ left: zero, right: $2, lineNumber: yylineno });
    }
    | simple_expression '+' simple_expression { $$ = new NodePlus({ left: $1, right: $3, lineNumber: yylineno }); }
    | simple_expression '-' simple_expression { $$ = new NodeMinus({ left: $1, right: $3, lineNumber: yylineno }); }
    | simple_expression '*' simple_expression { $$ = new NodeMul({ left: $1, right: $3, lineNumber: yylineno }); }
    | simple_expression '/' simple_expression { $$ = new NodeDiv({ left: $1, right: $3, lineNumber: yylineno }); }
    | simple_expression '%' simple_expression { $$ = new NodeMod({ left: $1, right: $3, lineNumber: yylineno }); }
    | simple_expression '^' simple_expression { $$ = new NodePower({ left: $1, right: $3, lineNumber: yylineno }); }
    | simple_expression '!'  { $$ = new NodeFactorial({ value: $1, lineNumber: yylineno }); }
    | '(' simple_expression ')' { $$ = $2; }
    ;

primary
    : function_call
    | variable_identifier
    | NUMBER { $$ = new NodeNumber({ value: $1, lineNumber: yylineno }); }
    ;
