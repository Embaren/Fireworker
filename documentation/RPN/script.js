//documentation/RPN

import {formula_tags} from "/scripts/utils.js";
import {document_createBoldNode, getCustomRow} from "/scripts/DOMutils.js";

const mainDiv = document.getElementById("main_div");

const docDiv = document.createElement("div");
mainDiv.appendChild(docDiv);

{ // Title
    const h2_rpn = document.createElement("h2");
    h2_rpn.appendChild(document.createTextNode("Reverse Polish Notation (RPN)"));
    docDiv.appendChild(h2_rpn);
}
{ // Documentation
    const docContentDiv = document.createElement("div");
    docContentDiv.classList.add("content_div");
    docContentDiv.classList.add("variables");
    docContentDiv.classList.add("text");
    
    const h3_documentation = document.createElement("h3");
    h3_documentation.appendChild(document.createTextNode("Documentation"));
    docDiv.appendChild(h3_documentation);
    
    {
        const p = document.createElement("p");
        const p_text = document.createTextNode("Reverse Polish Notation is a postfix mathematical notation, used for its non-ambiguous representation of formulas without any parenthesis. In this notation, the operators or function follow their arguments.");
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const p_text = document.createTextNode("RPN is evaluated left-to-right, relying on a stack structure. Each constant or value is added on top on the stack. When a function requiring n arguments is called, the top n elements of the stack are popped, the function is applied and the result is pushed on top of the stack. When the right end of the formula is reached, the stack shall contain exactly one element: the result of the computation.");
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    
    docDiv.appendChild(docContentDiv);
}
{ // Examples
    const examplesContentDiv = document.createElement("div");
    examplesContentDiv.classList.add("content_div");
    examplesContentDiv.classList.add("variables");
    
    const h3_examples = document.createElement("h3");
    h3_examples.appendChild(document.createTextNode("Examples"));
    docDiv.appendChild(h3_examples);
    
    const categories = ["Usual notation","Reversed Polish Notation equivalent"];
    const titles = [];
    for(const category of categories){
        titles.push(document_createBoldNode(category));
    }
    const titles_row = getCustomRow(titles);
    examplesContentDiv.appendChild(titles_row);
    
    const examples = [
        ["2*(5+3)","5 3 + 2 *"],
        ["2*(5+3)","2 5 3 + *"],
        ["1/(1+EXP(-A))","A NEG EXP 1 + INV"],
        ["1/(1+EXP(-A))","1 0 A - EXP 1 + /"],
        ["SQRT(A^2 + B^2)","A 2 ^ B 2 ^ + SQRT"],
        ["SQRT(A^2 + B^2)","A SQUARE B SQUARE + SQRT"],
        ["SQRT(A^2 + B^2)","A B NORM2D"],
        ["COS(2*PI/3)","2 PI 3 / * COS"],
        ["(2*A)/(2*A+1)","2 A * 2 A * 1 + /"],
        ["(2*A)/(2*A+1)","2 A * DUP 1 + /"],
        ["(2*A+1)/(2*A)","2 A *  1 + 2 A * /"],
        ["(2*A+1)/(2*A)","2 A * DUP 1 + SWAP /"],
    ];
    
    for(const [example_usual, example_rpn] of examples){
        const hr = document.createElement("hr");
        examplesContentDiv.appendChild(hr);
        const usual_text = document.createTextNode(example_usual);
        const rpn_text = document.createTextNode(example_rpn);
        const row = getCustomRow([usual_text,rpn_text]);
        row.classList.add("formula");
        examplesContentDiv.appendChild(row);
    }            
    docDiv.appendChild(examplesContentDiv);
}

const dictDiv = document.createElement("div");
mainDiv.appendChild(dictDiv);

const h2_glossary = document.createElement("h2");
h2_glossary.appendChild(document.createTextNode("Glossary"));
dictDiv.appendChild(h2_glossary);
    
{ // Functions
    const functionsListDiv = document.createElement("div");
    functionsListDiv.classList.add("content_div");
    functionsListDiv.classList.add("variables");
    
    const h3_functions = document.createElement("h3");
    h3_functions.appendChild(document.createTextNode("Function and constant tags"));
    dictDiv.appendChild(h3_functions);
    
    const categories = ["Tag","Nb inputs","Description"];
    const titles = [];
    for(const category of categories){
        titles.push(document_createBoldNode(category));
    }
    const titles_row = getCustomRow(titles, [0.2, 0.1, 0.7]);
    functionsListDiv.appendChild(titles_row);
    for(const [formula_id, formula] of Object.entries(formula_tags)){
        const hr = document.createElement("hr");
        functionsListDiv.appendChild(hr);
        const identifier = document.createTextNode(formula_id);
        const nb_inputs = document.createTextNode(formula.inputs);
        const description = document.createTextNode(formula.description ? formula.description : "No description");
        const row = getCustomRow([identifier,nb_inputs,description], [0.2, 0.1, 0.7]);
        functionsListDiv.appendChild(row);
    }
    dictDiv.appendChild(functionsListDiv);
}
{ // Special
    const specialListDiv = document.createElement("div");
    specialListDiv.classList.add("content_div");
    specialListDiv.classList.add("variables");
    
    const h3_specials = document.createElement("h3");
    h3_specials.appendChild(document.createTextNode("Other special tags"));
    dictDiv.appendChild(h3_specials);
    
    const categories = ["Tag","Nb inputs","Description"];
    const titles = [];
    for(const category of categories){
        titles.push(document_createBoldNode(category));
    }
    const titles_row = getCustomRow(titles, [0.2, 0.1, 0.7]);
    specialListDiv.appendChild(titles_row);
    
    const special_tags = [];
    special_tags.push(["FRAMERATE",0,"Value corresponding to the framerate of the environment."]);
    special_tags.push(["FROM_BIT",0,"Tag only available for trail color. Stand-alone, not usable in formulas. Assigns the corresponding color value from the firework bit color field."]);
    
    for(const [formula_id, formula_inputs, formula_description] of special_tags){
        const hr = document.createElement("hr");
        specialListDiv.appendChild(hr);
        const identifier = document.createTextNode(formula_id);
        const nb_inputs = document.createTextNode(formula_inputs);
        const description = document.createTextNode(formula_description ? formula_description : "No description");
        const row = getCustomRow([identifier,nb_inputs,description], [0.2, 0.1, 0.7]);
        specialListDiv.appendChild(row);
    }
    dictDiv.appendChild(specialListDiv);
}