//documentation

import {document_createBoldNode, getCustomRow} from "/scripts/DOMutils.js";

const mainDiv = document.getElementById("main_div");

const docDiv = document.createElement("div");
mainDiv.appendChild(docDiv);
{ // Title
    const h2_docu = document.createElement("h2");
    h2_docu.appendChild(document.createTextNode("Documentation"));
    docDiv.appendChild(h2_docu);
}
{
    const a = document.createElement("a");
    a.href = "/documentation/firework_composition";
    a.classList.add("content_div");
    a.classList.add("a_button");
    a.classList.add("firework");
    const a_text =  document.createTextNode("➲ Firework composition ➲");
    a.appendChild(a_text);
    docDiv.appendChild(a);
}
{
    const a = document.createElement("a");
    a.href = "/documentation/sequence_structure";
    a.classList.add("content_div");
    a.classList.add("a_button");
    a.classList.add("sequence");
    const a_text =  document.createTextNode("➲ Sequence structure ➲");
    a.appendChild(a_text);
    docDiv.appendChild(a);
}
{
    const a = document.createElement("a");
    a.href = "/documentation/RPN";
    a.classList.add("content_div");
    a.classList.add("a_button");
    a.classList.add("variables");
    const a_text =  document.createTextNode("➲ Reverse Polish Notation and available functions ➲");
    a.appendChild(a_text);
    docDiv.appendChild(a);
}
{ // Thank you
    const p = document.createElement("p");
    const small = document.createElement("small");
    const i = document.createElement("i");
    const ty_text =  document.createTextNode("Thank you Pauline for the amazing idea and for allowing me to nastily steal it :)");
    i.appendChild(ty_text);
    small.appendChild(i);
    p.appendChild(small);
    docDiv.appendChild(p);
}