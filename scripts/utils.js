const formula_tags = {
    "RANDOM" : {
        "inputs": 0,
        "fun": ()=>{return Math.random();}
    },
    "PI" : {
        "inputs": 0,
        "fun": ()=>{return Math.PI;}
    },
    "+" : {
        "inputs": 2,
        "fun": (a,b)=>{return a+b;}
    },
    "-" : {
        "inputs": 2,
        "fun": (a,b)=>{return a-b;}
    },
    "*" : {
        "inputs": 2,
        "fun": (a,b)=>{return a*b;}
    },
    "/" : {
        "inputs": 2,
        "fun": (a,b)=>{return a/b;}
    },
    "COS" : {
        "inputs": 1,
        "fun": Math.cos
    },
    "SIN" : {
        "inputs": 1,
        "fun": Math.sin
    },
    "TAN" : {
        "inputs": 1,
        "fun": Math.tan
    },
    "ACOS" : {
        "inputs": 1,
        "fun": Math.acos
    },
    "ASIN" : {
        "inputs": 1,
        "fun": Math.asin
    },
    "ATAN" : {
        "inputs": 1,
        "fun": Math.atan
    },
    "ABS" : {
        "inputs": 1,
        "fun": Math.abs
    },
    "SQRT" : {
        "inputs": 1,
        "fun": Math.sqrt
    },
    "SQUARE" : {
        "inputs": 1,
        "fun": (a)=>{return Math.pow(a,2)}
    },
    "POW" : {
        "inputs": 2,
        "fun": Math.pow
    },
    "EXP" : {
        "inputs": 1,
        "fun": Math.exp
    },
    "LOG" : {
        "inputs": 1,
        "fun": Math.log
    },
    "MAX" : {
        "inputs": 2,
        "fun": (a,b)=>{return Math.max(a,b)}
    },
    "MIN" : {
        "inputs": 2,
        "fun": (a,b)=>{return Math.min(a,b)}
    },
    "NORM2D" : {
        "inputs": 2,
        "fun": (a,b)=>{return Math.sqrt(Math.pow(a,2)+Math.pow(b,2))}
    },
    "NORM3D" : {
        "inputs": 3,
        "fun": (a,b,c)=>{return Math.sqrt(Math.pow(a,2)+Math.pow(b,2)+Math.pow(c,2))}
    },
};

export function parseFormula(formula_string, variables){
    if(formula_string===""){
        throw new Error('Formula evaluation : empty formula');
    }
    if(!isNaN(formula_string)){
        return parseFloat(formula_string);
    }
    if(formula_string==Infinity){
        return Infinity;
    }
    const formula_array = formula_string.split(' ');
    const pile = [];
    for(const instruction of formula_array){
        if(instruction in formula_tags){
            const nb_inputs = formula_tags[instruction].inputs;
            if(pile.length<nb_inputs){
                throw new Error('Formula evaluation : wrong pattern for "'+instruction+'" in formula "'+formula_string+'"');
            }
            pile.push(formula_tags[instruction].fun(...pile.splice(-nb_inputs, nb_inputs)));
        }
        else if(!isNaN(parseFloat(instruction))){
            pile.push(parseFloat(instruction));
        }
        else if(instruction in variables){
                    pile.push(variables[instruction]);
                }
        else{
            throw new Error('Formula evaluation : unknown instruction "'+instruction+'" in formula ""'+formula_string+'"');
        }
    }
    
    if(pile.length==0){
        throw new Error('Formula evaluation : no value remaining');
    }
    if(pile.length>1){
        throw new Error('Formula evaluation : more than 1 value remaining');
    }
    return pile[0];
}

export function downloadJSON(data, fileName, extension = ".json") {
  const jsonData = JSON.stringify(data)
  const a = document.createElement("a");
  const file = new Blob([jsonData], {type: 'text/plain'});
  a.href = URL.createObjectURL(file);
  a.download = fileName+'.'+extension;
  a.click();
  URL.revokeObjectURL(a.href);
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export class Point {
  constructor(x, y, variables={}) {
    this.x = parseFormula(x,variables);
    this.y = parseFormula(y,variables);
  }
  add(velocity) {
    return(new Point(this.x + velocity.x, this.y + velocity.y));
  }
  scale(factor) {
    return(new Point(this.x * factor, this.y * factor));
  }
  norm() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }
  copy(){
      return new Point(this.x, this.y);
  }
  static fromList(list, variables = {}){
    return new Point(list[0], list[1], variables);
  }
  list(){
    return [this.x, this.y];
  }
}

export class Color {
  constructor(r, g, b, a=1.,variables={}) {
    this.r = parseFormula(r,variables);
    this.g = parseFormula(g,variables);
    this.b = parseFormula(b,variables);
    this.a = parseFormula(a,variables);
  }
  scale(factor) {
    return new Color(this.r * factor, this.g * factor, this.b * factor, this.a);
  }
  scaleAlpha(factor) {
    return new Color(this.r * factor, this.g * factor, this.b * factor, this.a * factor);
  }
  add(color) {
    return new Color(this.r + color.r, this.g + color.g, this.b + color.b);
  }
  addAlpha(color) {
    return new Color(this.r + color.r, this.g + color.g, this.b + color.b, this.a + color.a);
  }
  norm() {
    return Math.sqrt(this.r*this.r + this.g*this.g + this.b*this.b);
  }
  html() {
    return "#" + componentToHex(Math.round(this.r*255)) + componentToHex(Math.round(this.g*255)) + componentToHex(Math.round(this.b*255)) + componentToHex(Math.round(this.a*255));
  }
  copy(){
      return new Color(this.r, this.g, this.b, this.a);
  }
  static fromList(list, variables={}) {
    return new Color(list[0],list[1],list[2],list[3],variables);
  }
  list() {
    return [this.r,this.g,this.b,this.a];
  }
  fromHTML(htmlCode) {
    this.r = parseInt(htmlCode.slice(1,3),16)/255
    this.g = parseInt(htmlCode.slice(3,5),16)/255
    this.b = parseInt(htmlCode.slice(5,7),16)/255
  }
}

