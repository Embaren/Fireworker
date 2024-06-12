//documentation/sequence_structure

import {formula_tags} from "/scripts/utils.js";
import {document_createBoldNode, getCustomRow} from "/scripts/DOMutils.js";

const mainDiv = document.getElementById("main_div");

const docDiv = document.createElement("div");
mainDiv.appendChild(docDiv);

{ // Title
    const h2_rpn = document.createElement("h2");
    h2_rpn.appendChild(document.createTextNode("Sequence structure"));
    docDiv.appendChild(h2_rpn);
}
{ // Sequence
    const docContentDiv = document.createElement("div");
    docContentDiv.classList.add("content_div");
    docContentDiv.classList.add("sequence");
    docContentDiv.classList.add("text");
    
    const h3_documentation = document.createElement("h3");
    h3_documentation.appendChild(document.createTextNode("Sequence"));
    docDiv.appendChild(h3_documentation);
    
    {
        const p = document.createElement("p");
        const str = "The sequence is your grand plan, your masterpiece: it is the timeline of your firework show. It is where you define which fireworks will lauch, where, and how.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const str = "You can load and save your sequence using the appropriate buttons. This way, you can share your creations with your friends, or see theirs. Don't forget to save your sequence before quitting the page!";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const str = "";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    
    docDiv.appendChild(docContentDiv);
}
{ // Groups
    const docContentDiv = document.createElement("div");
    docContentDiv.classList.add("content_div");
    docContentDiv.classList.add("sequence");
    docContentDiv.classList.add("text");
    
    const h3_documentation = document.createElement("h3");
    h3_documentation.appendChild(document.createTextNode("Groups"));
    docDiv.appendChild(h3_documentation);
    
    {
        const p = document.createElement("p");
        const str = "The basic component of a sequence is a group, which represent a segment of the show. It is a collection of emitters and their delays, which can be globally offset by a group delay and brings flexibility to the sequence creation.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const str = "Each firework you add must belong to a group. You can also save and load groups to reuse them multiple times, or to keep them in store for another project.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const str = "By selecting a group (circular button on the left of the group) you can also previsualize all the emitters it contains. It allows you to efficiently place your fireworks relatively to each other, without the visual noise of seeing your whole project at once.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    
    docDiv.appendChild(docContentDiv);
}