//documentation/firework_composition

import {formula_tags} from "/scripts/utils.js";
import {document_createBoldNode, getCustomRow, document_createElement_vr} from "/scripts/DOMutils.js";
import {getParameterDoc} from "/scripts/tooltips.js";
import {demo_default_dims} from "/scripts/demo.js";

function getParametersTable(tags,theme){
    const parametersDiv = document.createElement("div");
    parametersDiv.classList.add("content_div");
    parametersDiv.classList.add(theme);
    
    const categories = ["Parameter","Description"];
    const titles = [];
    for(const category of categories){
        titles.push(document_createBoldNode(category));
    }
    const titles_row = getCustomRow(titles, [0.2, 0.8]);
    titles_row.appendChild(document_createElement_vr());
    const demo_title_cell = document.createElement("div");
    const demo_title_box = document.createElement("div");
    demo_title_box.style.width = (2*demo_default_dims[1]+2*2.66666667).toFixed(6)+"px";
    const demo_title = document_createBoldNode("Demo");
    demo_title_box.appendChild(demo_title);
    demo_title_cell.appendChild(demo_title_box);
    titles_row.appendChild(demo_title_cell);
    parametersDiv.appendChild(titles_row);
    
    for(const tag of tags){
        const parameterDoc = getParameterDoc(tag);
        const hr = document.createElement("hr");
        parametersDiv.appendChild(hr);
        const name = document_createBoldNode(parameterDoc.name);
        const description = document.createTextNode(parameterDoc.description);
        const demo = parameterDoc.demo_element;
        //const row = getCustomRow([name,description,demo], [0.2, 0.6, 0.2]);
        const row = getCustomRow([name,description], [0.2, 0.8]);
        row.appendChild(document_createElement_vr());
        row.appendChild(demo);
        parametersDiv.appendChild(row);
    }
    return parametersDiv;
}

const mainDiv = document.getElementById("main_div");

const docDiv = document.createElement("div");
mainDiv.appendChild(docDiv);

{ // Title
    const h2_rpn = document.createElement("h2");
    h2_rpn.appendChild(document.createTextNode("Firework composition"));
    docDiv.appendChild(h2_rpn);
}
{ // Documentation
    const docContentDiv = document.createElement("div");
    docContentDiv.classList.add("content_div");
    docContentDiv.classList.add("documentation");
    docContentDiv.classList.add("text");
    
    const h3_documentation = document.createElement("h3");
    h3_documentation.appendChild(document.createTextNode("Documentation"));
    docDiv.appendChild(h3_documentation);
    
    {
        const p = document.createElement("p");
        const str = "When designing a firework, you need to think about two elements: the emitter (how you firework is launched from the ground), and the charge (which corresponds to an explosion).";
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
{ // Emitters
    const docContentDiv = document.createElement("div");
    docContentDiv.classList.add("content_div");
    docContentDiv.classList.add("emitter");
    docContentDiv.classList.add("text");
    
    const h3_documentation = document.createElement("h3");
    h3_documentation.appendChild(document.createTextNode("Emitters"));
    docDiv.appendChild(h3_documentation);
    
    {
        const p = document.createElement("p");
        const str = "The emitter defines how the firework is launched. It designates its origin (a position on the bottom of the screen) and its target (where the firework is aimed at). The emitter also defines a delay before launching the firework, to allow for complex configuration of synchronized fireworks!";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
        
        //new Demo(docContentDiv,[200,200]);
    }
    {
        const p = document.createElement("p");
        const str = "An emitter can work in two different modes: either launching a rocket which will explode the charge at the target or directly igniting the charge with an initial velocity towards the target. If the mode is 'rocket', the field 'rocket time' will display the travel time of the rocket before reaching its destination.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const str = "The emitter can be either instantaneous ('emition duration'=0) or continuous ('emition duration'>0). If instantaneous, the charge will only be ignited one. However if continuous, the charge will be emitted repeatedly for the specified duration. A continuous emitter can be seen in sprays.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    
    docDiv.appendChild(docContentDiv);
}
{ // Emitters parameters
    const h3_emitter_parameters = document.createElement("h3");
    h3_emitter_parameters.appendChild(document.createTextNode("Emitter parameters"));
    docDiv.appendChild(h3_emitter_parameters);
    
    docDiv.appendChild(getParametersTable(["rocket","emitter_duration"],"emitter"));
}
{ // Charges
    const docContentDiv = document.createElement("div");
    docContentDiv.classList.add("content_div");
    docContentDiv.classList.add("firework");
    docContentDiv.classList.add("text");
    
    const h3_documentation = document.createElement("h3");
    h3_documentation.appendChild(document.createTextNode("Charges"));
    docDiv.appendChild(h3_documentation);
    
    {
        const p = document.createElement("p");
        const str = "The charge is the explosive device, containing the effect of your firework. When ignited, it projects 'Nb fragments' fragments all around its current location following the specified shape. The higher the 'projection speed', the bigger the radius of the firework.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const str = "Each fragment is composed of two elements: its head (the solid bit defining its trajectory) and its optional trail, each of which can have a different color. A fragment has a 'lifespan', which is the duration before it goes extinct. On the frame it goes extinct, the fragment ignites its optional 'cascades' on its location, which are other custom charges.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docContentDiv.appendChild(p);
    }
    
    docDiv.appendChild(docContentDiv);
}
{ // Charge parameters
    const h3_charge_parameters = document.createElement("h3");
    h3_charge_parameters.appendChild(document.createTextNode("Charge parameters"));
    docDiv.appendChild(h3_charge_parameters);
    
    docDiv.appendChild(getParametersTable(["shape","head_color","fragment_lifespan","projection_speed","nb_bits","trail","cascade"],"firework"));
}
{ // Trails
    const docContentDiv = document.createElement("div");
    docContentDiv.classList.add("content_div");
    docContentDiv.classList.add("firework");
    docContentDiv.classList.add("utils_div");
    
    const docTextDiv = document.createElement("div");
    docTextDiv.classList.add("text");
    
    const h3_documentation = document.createElement("h3");
    h3_documentation.appendChild(document.createTextNode("Trails"));
    docDiv.appendChild(h3_documentation);
    
    {
        const p = document.createElement("p");
        const str = "Trails are the particles that are left behind a fragment's head. The particles have a size defined by their 'radius', a 'color', and a 'lifespan' (how long it will persist). Each frame, 'amount' number of particles are created around the fragment's head within the 'dispersion' parameter radius.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docTextDiv.appendChild(p);
    }
    {
        const p = document.createElement("p");
        const str = "Futhermore, a delay can be defined for trails, meaning how long before the first particle is emitted ; as well as an optional maximum duration of particle emission.";
        const p_text = document.createTextNode(str);
        p.appendChild(p_text)
        docTextDiv.appendChild(p);
    }
    
    docContentDiv.appendChild(docTextDiv);

    const demo = getParameterDoc("trail")['demo_element'];
    demo.classList.add("text");
    docContentDiv.appendChild(demo);
    
    docDiv.appendChild(docContentDiv);
}
{ // Trail parameters
    const h3_trail_parameters = document.createElement("h3");
    h3_trail_parameters.appendChild(document.createTextNode("Charge parameters"));
    docDiv.appendChild(h3_trail_parameters);
    
    docDiv.appendChild(getParametersTable(["trail_color","trail_lifespan","trail_radius","trail_amount","trail_dispersion","trail_delay","trail_duration"],"firework"));
}