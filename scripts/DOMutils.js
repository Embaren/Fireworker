export function document_createElement_vr(){
    const vr = document.createElement('div');
    vr.classList.add("vr");
    const vertical_hr = document.createElement('hr');
    vr.append(vertical_hr);
    return vr;
};

export function document_createBoldNode(str){
    const text_node = document.createTextNode(str);
    const b = document.createElement("b");
    b.appendChild(text_node);
    return b;
}

export function document_createTooltip(tooltip_content){
    const tooltip = document.createElement("span");
    const icon = document.createTextNode("ⓘ");
    tooltip.appendChild(icon);
    
    const span = document.createElement("span");
    span.appendChild(tooltip_content);
    
    tooltip.appendChild(span);
    tooltip.classList.add("tooltip");
    return tooltip;
}

export function getCustomRow(elements, ratios=[]){
    const n = elements.length;
    const m = ratios.length;
    if(m>n){
        throw new Error('make_custom_row: more ratios than elements');
    }
    
    let ratios_sum = 0.;
    for(let i=0 ; i<m ; i++){
        ratios_sum += ratios[i];
    }
    if(ratios_sum>1.0001){
        throw new Error('make_custom_row: ratios sum ('+ratios_sum.toString()+') greater than 1');
    }
    const ratio_step = (1. - ratios_sum)/(n-m)
    for(let i=m ; i<n ; i++){
        ratios.push(ratio_step);
    }
        
    const row = document.createElement('div');
    row.classList.add("custom_row");
    
    for(let i=0 ; i<n ; i++){
        if(i>0){
            row.append(document_createElement_vr());
        }
        const cell = document.createElement('div');
        cell.classList.add("column");
        cell.style.width = (ratios[i]*100).toFixed(4)+"%";
        cell.style.height = "inherit";
        const container = document.createElement('div');
        if(elements[i]?.classList?.contains('column')){
            container.style.height = "100%";
        }
        container.appendChild(elements[i]);
        cell.appendChild(container);
        row.append(cell);
    }
    return row;
}