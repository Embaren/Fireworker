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
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = "/documentation/RPN";
    const a_text =  document.createTextNode("Reversed Polish Notation and available functions");
    a.appendChild(a_text);
    p.appendChild(a);
    docDiv.appendChild(p);
}