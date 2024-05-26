import {Color, Point, downloadJSON} from "/scripts/utils.js";
import {document_createElement_vr, document_createBoldNode, document_createTooltip, getCustomRow} from "/scripts/DOMutils.js";
import {Template} from "/scripts/fireworks.js";
import {EmitterGroup} from "/scripts/environment.js";


function isCustomProperty(property,type){
    switch (type) {
        case "number":
            return isNaN(property);
        break;
        case "integer":
            return isNaN(property);
        break;
        case "color":
            let is_custom_color = false;
            for(let i=0 ; i<4 ; i++){
                is_custom_color = is_custom_color || isNaN(property[i]);
            }
            return is_custom_color;
        break;
        default:
            true;
        break;
    }
}

// Functions for a specific env

function create_random_emitter_from_template(environment, pos, templates){
    const origin = new Point((Math.random()-.5)*environment.game_canvas.width/2,0.);
    
    const template_id = Math.floor(Math.random()*templates.length);
    
    try{
        const emitter = templates[template_id].getEmitter(origin, pos);
        return emitter;
    }
    catch(err){
        window.alert('The emitter could not be created from template "'+templates[template_id].name+'" due to the following error:\n\n'+err);
    }
}

class TemplatesManager{
    constructor(env,postLoading=()=>{}){
        this.env = env;
        this.postLoading = postLoading;
        this.base = [];
        this.custom = [];
        this.length = 0;
        this.selected_template = 0;
        fetch('/resources/templates/list.json')
            .then((response) => response.json())
            .then((list) => {
                const promises = [];
                for(const template_name of list){
                    promises.push(fetch('/resources/templates/'+template_name+'.ftemplate')
                        .then((response) => response.json())
                        .then((json) => {this.base.push(Template.load(json,this.env));this.length+=1;})
                        );
                Promise.all(promises).then((values)=>{
                    this.postLoading();
                });
                }
            });
    }
    all(){
        return this.base.concat(this.custom);
    }
    loadCustom(data){
        this.custom.push(Template.load(data,this.env));
        this.length+=1;
    }
    addCustom(template){
        this.custom.push(template);
        this.length+=1;
    }
    getSelected(){
        return this.all()[this.selected_template];
    }
    export(i){
        const data = this.all()[i].toJSON();
        downloadJSON(data,this.all()[i].name.toLowerCase().replace(/\s+/g, ''),"ftemplate");
    }
}

class Cursor{
    constructor(env){
        this.env = env;
        this.isOn = false;
        this.type = "default";
        this.root = new Point(0,0);
        this.mouse_pos = new Point(0,-100);
        const self = this;
        env.game_canvas.addEventListener('mousemove', function updateCoordinates(e){self.mouse_pos = env.getCursorPosition(e);});
        function drawCursor(){
            if (self.isOn){
                const pos = self.mouse_pos;
                switch (self.type) {
                    case "target":
                        env.ctx.strokeStyle = new Color(1.,1.,1.,1.).html();
                        env.ctx.beginPath();
                        env.ctx.rect(pos.x-.5, pos.y-4, 1, 8);
                        env.ctx.rect(pos.x-4, pos.y-.5, 8, 1);
                        env.ctx.moveTo(self.root.x,self.root.y);
                        env.ctx.lineTo(pos.x,pos.y);
                        env.ctx.stroke();
                    break;
                    case "origin":
                        env.ctx.strokeStyle = new Color(1.,1.,1.,1.).html();
                        env.ctx.beginPath();
                        env.ctx.rect(pos.x-.5, -4, 1, 8);
                        env.ctx.rect(pos.x-4, -.5, 8, 1);
                        env.ctx.moveTo(self.root.x,self.root.y);
                        env.ctx.lineTo(pos.x,0);
                        env.ctx.stroke();
                    break;
                    case "velocity":
                        env.ctx.strokeStyle = new Color(1.,1.,1.,1.).html();
                        env.ctx.beginPath();
                        env.ctx.rect(pos.x-.5, pos.y-4, 1, 8);
                        env.ctx.rect(pos.x-4, pos.y-.5, 8, 1);
                        env.ctx.moveTo(self.root.x,self.root.y);
                        env.ctx.lineTo(self.root.x,self.root.x+self.env.game_canvas.height/6);
                        env.ctx.moveTo(self.root.x,self.root.y);
                        env.ctx.lineTo(pos.x,pos.y);
                        env.ctx.stroke();
                    break;
                    case "sync":
                        env.ctx.strokeStyle = new Color(1.,1.,1.,1.).html();
                        env.ctx.beginPath();
                        env.ctx.rect(pos.x-.5, pos.y-4, 1, 8);
                        env.ctx.rect(pos.x-4, pos.y-.5, 8, 1);
                        env.ctx.moveTo(pos.x,0);
                        env.ctx.lineTo(pos.x,pos.y);
                        env.ctx.stroke();
                    break;
                    default:
                        env.ctx.strokeStyle = new Color(1.,1.,1.,1.).html();
                        env.ctx.beginPath();
                        env.ctx.rect(pos.x-.5, pos.y-4, 1, 8);
                        env.ctx.rect(pos.x-4, pos.y-.5, 8, 1);
                        env.ctx.stroke();
                }
            }
            return true;
        }
        this.env.step_functions.push(drawCursor);
    }
    on(){
        this.env.game_canvas.style.cursor = 'none';
        this.isOn = true;
    };
    
    off(){
        this.env.game_canvas.style.cursor = 'default';
        this.isOn = false;
    };
}

class CoordEditor{
    constructor(cursor){
        this.active = null;
        this.cursor = cursor;
    }
    
    activate(button, text, object, field, post_fun=()=>{}){
        if (this.active){
            this.deactivate();
        }
        this.active = button;
        this.active.classList.add("activeCoordEditor");
        this.cursor.env.setOnclick((e) => {
            const pos = this.cursor.env.getCursorPosition(e);
            if(this.cursor.type==="sync"){
                object[field[0]]=pos.copy();
                field = field[1];
                this.cursor.type="origin";
            }
            if(this.cursor.type==="origin"){
                pos.y = 0;
            }
            object[field] = pos;
            this.deactivate();
            if(text!==undefined){
                text.nodeValue = pos.x.toFixed(2)+", "+pos.y.toFixed(2);
            }
            post_fun();
        });
        this.cursor.on();
    }
    
    deactivate(){
        this.cursor.off();
        if (this.active){
            this.active.classList.remove("activeCoordEditor");
        }
        this.cursor.env.setOnclick();
        this.active=null;
    }
    
    updateFromInput(emitter,type,post_fun=()=>{}){
        return (button, text=undefined)=>{
            self = this;
            return ()=>{
                if (this.active===button){
                    this.deactivate();
                    return;
                }
                this.cursor.type = type;
                switch (type) {
                    case "target":
                        this.cursor.root = emitter.pos;
                        this.activate(button, text, emitter, 'target', post_fun);
                    break;
                    case "origin":
                        this.cursor.root = emitter.target;
                        this.activate(button, text, emitter, 'pos', post_fun);
                    break;
                    case "velocity":
                        this.cursor.root = emitter.pos;
                        //this.cursorRoot = new Point(0,0);
                        this.activate(button, text, emitter, 'target', post_fun);
                    break;
                    case "sync":
                        this.cursor.root = emitter.pos;
                        this.activate(button, text, emitter, ['target','pos'], post_fun);
                    break;
                }
            }
        }
    }
    
}

function updateColorFromInput(object,field){
    return {
        'color': function(input){
            return function(e){
                object[field].fromHTML(input.value);
            }
        },
        'alpha':  function(input){
            return function(e){
                object[field].a = parseFloat(input.value)/255;
            }
        }}
}function updateColorListFromInput(object,field){
    return {
        'color': function(input){
            return function(e){
                const color = Color.fromList(object[field]);
                color.fromHTML(input.value);
                object[field] = color.list();
            }
        },
        'alpha':  function(input){
            return function(e){
                object[field][3] = parseFloat(input.value)/255;
            }
        }}
}

function updateFieldFromInput(object,field,value_fun,post_fun=()=>{}){
    return function(input){
        return function(e){
            object[field] = value_fun(input.value);
            post_fun();
        }
    }
}

function getInputElement(type, value, disabled = true, on_change=null, id=""){
    var element = null;
    switch (type) {
        case "text":
            element = document.createElement("input");
            element.type = "text";
            element.value = value;
            element.autocomplete = "off";
            element.id = id;
            element.disabled = disabled;
            if(on_change!==null){
                element.addEventListener("input", on_change(element));
            }
        break;
        case "number":
            if(disabled){
                element = document.createTextNode(parseFloat(value).toFixed(2));
            }
            else{
                element = document.createElement("input");
                element.type = "number";
                element.id = id;
                element.lang = "en_EN";
                element.min = "0.00";
                element.step="0.01";
                element.value = parseFloat(value).toFixed(2);
                element.disabled = disabled;
                if(on_change!==null){
                    element.addEventListener("input", on_change(element));
                }
            }
        break;
        case "integer":
            if(disabled){
                element = document.createTextNode(value);
            }
            else{
                element = document.createElement("input");
                element.type = "number";
                element.id = id;
                element.lang = "en_EN";
                element.min = "0";
                element.step="1";
                element.value = value;
                element.disabled = disabled;
                if(on_change!==null){
                    element.addEventListener("input", on_change(element));
                }
            }
        break;
        case "coords_button":
            element = document.createElement("span");
            if(!disabled){
                const button = document.createElement("button");
                button.classList.add("icon_button");
                const text_div = document.createElement("div");
                const text = document.createTextNode(value);
            
                button.onclick = on_change(button, text);//this.coordinatePicker(button);
                button.id = id;
                const buton_text = document.createTextNode("⌖");
                button.appendChild(buton_text);
                
                element.appendChild(button);
                text_div.appendChild(text);
                element.appendChild(text_div);
            }
            else{
                const text = document.createTextNode(value);
                element.appendChild(text);
            }
        break;
        case "bool":
            element = document.createElement("input");
            element.type = "checkbox";
            element.id = id;
            element.addEventListener("click", on_change);
            element.disabled = disabled;
            //element.onclick = on_change;
            if(value==='true'){
                element.checked = "checked";
            }
        break;
        case "color":
            element = document.createElement("span");
            element.id = id;
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.value = value.substring(0,7);
            colorInput.disabled = disabled;
            const alphaInput = document.createElement("input");
            alphaInput.type = "range";
            alphaInput.min = 0
            alphaInput.max = 255
            alphaInput.value = parseInt(value.substring(7), 16);
            alphaInput.disabled = disabled;
            element.appendChild(colorInput);
            element.appendChild(alphaInput);
            if(on_change!==null){
                colorInput.addEventListener("input", on_change['color'](colorInput));
                alphaInput.addEventListener("input", on_change['alpha'](alphaInput));
            }
        break;
        case "shape":
            if(disabled){
                element = document.createTextNode(value);
            }
            else{
                element = document.createElement("select");
                element.id = id;
                for(const shape of Object.keys(Template._fireworkShapes_)){
                    const option = document.createElement("option");
                    option.value = shape;
                    const optionText = document.createTextNode(shape);
                    option.appendChild(optionText);
                    element.appendChild(option);
                }
                element.value = value;
                element.disabled = disabled;
                if(on_change!==null){
                    element.addEventListener("input", on_change(element));
                }
            }
        break;
        case "none":
            element = document.createTextNode(value);
        break;
        default:
            element = document.createTextNode(value);
        break;
    }
    return element;
}

function fillRow(row, attributes, edit_type, ids, onchange_functions, edit, id_suffix = "", class_name = null){
    for(var j = 0; j < attributes.length; j++){
        const cell = document.createElement("td");
        
        if(class_name){
            cell.classList.add(class_name);
        }
        
        const disabled = (!edit || edit_type[j] === null);
        const span = document.createElement("span");
        
        const element = getInputElement(edit_type[j],attributes[j], disabled, disabled ? null : onchange_functions[j]);
        span.appendChild(element);
        cell.appendChild(span);
        cell.id = ids[j]+id_suffix;
        cell.classList.add(ids[j]);
        
        row.appendChild(cell);
    }
}

function getUploadButton(on_upload, button_text="", accept=undefined, multiple = false){
    const loadFileButton = document.createElement("button");
    loadFileButton.addEventListener('click',function(){
        loadFileInput.click();
    });
    const cell_text = document.createTextNode(button_text);
    loadFileButton.appendChild(cell_text);
    loadFileButton.classList.add('upload_button')
    
    function getFileInput(){
        const loadFileInput = document.createElement("input");
        loadFileInput.type = "file";
        loadFileInput.multiple = multiple;
        if(accept){
            loadFileInput.accept = accept;
        };
        loadFileInput.onchange = () => {
          const reader = new FileReader();
          var i = 0;
          reader.onload = (e) => {
              on_upload(e);
              i = i+1;
              if(i<loadFileInput.files.length){
                reader.readAsText(loadFileInput.files[i])
              }
              else{
                loadFileInput.replaceWith(getFileInput());
              }
          };
          reader.readAsText(loadFileInput.files[i]);
        }
        return loadFileInput;
    }
    const loadFileInput = getFileInput();
    return loadFileButton;
}

class EnvTable{
    constructor(env, container){
        this.env = env;
        this.container = container;
        
        const envBody = document.createElement("tbody");
        this.container.appendChild(envBody);
        this.envBody = envBody;
        
        this.update();
    }
    hide(){
        this.container.hidden = true;
    }
    show(){
        this.container.hidden = false;
    }
    update(){
        this.envBody.innerHTML = "";
        const categories = ["Framerate (/s)","Gravity [x,y] (pix/s)", "Dampening (pix/s)", "Dimensions [x,y] (pix)"];
        const attributes = [this.env.framerate.toString(),this.env.gravity.x.toFixed(2)+","+this.env.gravity.y.toFixed(1), this.env.dampen.toFixed(2), this.env.game_canvas.width.toString()+","+this.env.game_canvas.height.toString()];
        const rowTitle = document.createElement("tr");
        const row = document.createElement("tr");
        for(var j = 0; j < categories.length; j++){
            { // Title
                const cell = document.createElement("th");
                const cell_text = document.createTextNode(categories[j]);
                cell.appendChild(cell_text);
                rowTitle.appendChild(cell);
            }
            {
                const cell = document.createElement("td");
                const cell_text = document.createTextNode(attributes[j]);
                cell.appendChild(cell_text);
                row.appendChild(cell);
            }
        }
        
        { // Title
            const cell = document.createElement("th");
            const cell_text = document.createTextNode("Edit");
            cell.appendChild(cell_text);
            rowTitle.appendChild(cell);
        }
        {
            const cell = document.createElement("td");
            const button = document.createElement("button");
            button.id = "env_prop_editor_button";
            const cell_text = document.createTextNode("✎");
            button.appendChild(cell_text);
            cell.appendChild(button);
            row.appendChild(cell);
        }
        
        this.envBody.appendChild(rowTitle);
        this.envBody.appendChild(row);
    }
}

class SequenceEditor{
    constructor(env, template_manager, container){
        this.env = env;
        this.container = container;
        this.template_manager = template_manager;
        
        this.selected_group = -1;
        this.selected_emitter = -1;
    
        this.container.appendChild(document.createElement('br'));
        
        const utilsDiv = document.createElement("div");
        utilsDiv.classList.add("utils_div");
        const templateSelectorSpan = document.createElement("span");
        utilsDiv.appendChild(templateSelectorSpan);
        this.templateSelectorSpan = templateSelectorSpan;
        
        this.container.appendChild(utilsDiv);
        this.utilsDiv = utilsDiv;
        
        { // Import section
            const importSpan = document.createElement("span");
            
            const groupUploadButton = getUploadButton((e) => {
                const group_data = JSON.parse(e.target.result);
                this.env.loadGroup(group_data);
                this.update();
              }, "Load group", ".fgroup", true);
            
            const seqUploadButton = getUploadButton((e) => {
                const sequence_data = JSON.parse(e.target.result);
                this.env.loadSequence(sequence_data);
                this.update();
              }, "Load sequence", ".fsequence", false);
              
              importSpan.appendChild(groupUploadButton);
              importSpan.appendChild(seqUploadButton);
              
              {
                const env = this.env;
                const sequenceSaveButton = document.createElement("button");
                sequenceSaveButton.addEventListener('click',function(){
                  env.exportSequence("sequence");
                });
                const cell_text = document.createTextNode("Save sequence");
                sequenceSaveButton.appendChild(cell_text);
                importSpan.appendChild(sequenceSaveButton);
              }
              
            this.utilsDiv.appendChild(importSpan);
        }
        
        this.container.appendChild(document.createElement('hr'));
        
        const editEmitterDiv = document.createElement("div");
        this.container.appendChild(editEmitterDiv);
        this.editEmitterDiv = editEmitterDiv;
        
        const planDiv = document.createElement("div");
        planDiv.classList.add("plan_div");
        this.container.appendChild(planDiv);
        this.planDiv = planDiv;
        
        this.container.appendChild(document.createElement('br'));
        
        { // Create group section
            const createGroupDiv = document.createElement("div");
            const createGroupButton = document.createElement("button");
            createGroupButton.classList.add("create_group_button");
            createGroupButton.onclick = ()=>{this.env.createGroup("Group "+this.env.planned_groups.length.toFixed()); this.update();}
            const cell_text = document.createTextNode("Create new group");
            createGroupButton.appendChild(cell_text);
            createGroupDiv.appendChild(createGroupButton);
            this.container.appendChild(createGroupDiv);
        }
        this.container.appendChild(document.createElement('br'));
        
        this.initGhosts();
        this.cursor = new Cursor(this.env);
        this.coordEditor = new CoordEditor(this.cursor);
        
        this.selectGroup(0);
    }
    
    hide(){
        this.container.hidden = true;
    }
    show(){
        this.update();
        this.container.hidden = false;
    }

    initGhosts(){
        const self = this;
        const env = this.env;
        function drawGhost(emitter,alpha=1){
            const color = emitter.firework.bit_color.copy();
            color.a = color.a * alpha;
            if (emitter.use_rocket){
                env.ctx.strokeStyle = new Color(1.,1.,1.,.5*alpha).html();
                env.ctx.beginPath();
                env.ctx.rect(emitter.target.x-.5, emitter.target.y-4, 1, 8);
                env.ctx.rect(emitter.target.x-4, emitter.target.y-.5, 8, 1);
                env.ctx.moveTo(emitter.pos.x,emitter.pos.y);
                env.ctx.lineTo(emitter.target.x,emitter.target.y);
                env.ctx.stroke();
                env.ctx.strokeStyle = color.html();
                env.ctx.beginPath();
                env.ctx.arc(emitter.target.x, emitter.target.y, 5, 0, 2 * Math.PI);
                env.ctx.stroke();
            }
            else{
                env.ctx.strokeStyle = color.html();
                env.ctx.beginPath();
                env.ctx.moveTo(emitter.pos.x,emitter.pos.y);
                env.ctx.lineTo(emitter.target.x,emitter.target.y);
                env.ctx.stroke();
            }
        }
        function drawGhosts(){
            if (self.selected_group >=0){
                for(const emitter of self.env.planned_groups[self.selected_group].emitters){
                    drawGhost(emitter,.5);
                }
                if (self.selected_group>=0 && self.selected_emitter>=0){
                    const emitter = env.planned_groups[self.selected_group].emitters[self.selected_emitter];
                    drawGhost(emitter,1);
                    env.ctx.strokeStyle = new Color(1.,1.,1.,.5).html();
                    env.ctx.beginPath();
                    env.ctx.arc(emitter.pos.x, emitter.pos.y, 5, 0, 2 * Math.PI);
                    env.ctx.stroke();
                }
            }
            return true;
        }
        
        this.env.step_functions.push(drawGhosts);
    } 

    update(){          
        this.updateTemplateSelector();
    
        this.updateEditEmitterDiv();
        
        this.updatePlanDiv();
        return true;
    }
    
    updatePlanDiv(){
        this.planDiv.innerHTML = "";
        const title = document.createElement('h3');
        title.innerHTML = "Sequence";
        const tooltip = document_createTooltip(document.createTextNode("A sequence is composed of multiple groups of emitters. It corresponds to the entire plan for you fireworks show."));
        title.appendChild(tooltip);
        this.planDiv.appendChild(title);
        for(let i = 0 ; i < this.env.planned_groups.length ; i++){
            if(i>0){this.planDiv.appendChild(document.createElement('br'));}
            this.planDiv.appendChild(this.getGroupDiv(i));
        }
    }
    
    updateTemplateSelector(){
        this.templateSelectorSpan.innerHTML = "";
        
        const template_selector = document.createElement("select");
        template_selector.classList.add((this.template_manager.selected_template<this.template_manager.base.length) ? 'base_option' : 'custom_option');
        template_selector.id = "template_selector_group";
        for(let k = 0 ; k<this.template_manager.length ; k++){
            if(k===(this.template_manager.base.length)){
                template_selector.appendChild(document.createElement('hr'));
            }
            const option = document.createElement("option");
            option.classList.add((k<this.template_manager.base.length) ? 'base_option' : 'custom_option');
            option.value = k;
            const optionText = document.createTextNode(this.template_manager.all()[k].name);
            option.appendChild(optionText);
            template_selector.appendChild(option);
        }
        template_selector.value = this.template_manager.selected_template;
        template_selector.addEventListener("input", ()=>{this.template_manager.selected_template=template_selector.value;});
        

        const selector_button = document.createElement("button");
        selector_button.id = "template_selector_button";
        selector_button.onclick = ()=>{
            const origin = new Point((Math.random()-.5)*this.env.game_canvas.width/2,0.);
            try{
                const emitter = this.template_manager.getSelected().getEmitter(origin,origin);
                this.coordEditor.updateFromInput(emitter, 'sync',()=>{
                    const j = this.env.planned_groups[this.selected_group].length;
                    this.env.planned_groups[this.selected_group].push(emitter);
                    this.selectGroup(this.selected_group);
                })(selector_button)();
            }
            catch(err){
                window.alert('The emitter could not be created from template "'+this.template_manager.getSelected().name+'" due to the following error:\n\n'+err);
            }
        }
        selector_button.disabled = this.selected_group<0;
        const cell_text = document.createTextNode(this.selected_group < 0 ? "No group selected" : "Add emitter");
        selector_button.appendChild(cell_text);
        
        this.templateSelectorSpan.appendChild(template_selector);
        this.templateSelectorSpan.appendChild(selector_button);
    }
    
    getGroupDiv(i){
        const isActive = this.selected_group==i;
        
        const group_div = document.createElement("div");
        const content_div = document.createElement("div");
        const plan_div = document.createElement("div");
        plan_div.hidden = !isActive;
        
        if(isActive){
            group_div.classList.add("selected_group");
        }
        
        const group = this.env.planned_groups[i];
        
        {   // Header
            content_div.classList.add("content_div");
            
            const elements = [];
            
            { // Group selection
                const button = document.createElement("button");
                button.id = "group_select_button_"+i.toFixed();
                button.onclick = ()=>{this.selectGroup(isActive ? -1 : i);}
                const cell_text = document.createTextNode(isActive ? "◉︎" : "⭘");
                button.appendChild(cell_text);
                button.classList.add("icon_button");
                button.classList.add("radio_button");
                elements.push(button);
            }
            {// Expand button
                const button = document.createElement('button');
                button.id = "group_expand_button_"+i.toFixed();
                button.onclick = ()=>{button.innerHTML=plan_div.hidden ? "▼" : "▶";plan_div.hidden = !plan_div.hidden};
                const cell_text = document.createTextNode(isActive ? "▼" : "▶");
                button.appendChild(cell_text);
                button.classList.add("icon_button");
                elements.push(button);
            }
            
            { // Group name
                const element = getInputElement("text",group.name, false, updateFieldFromInput(group, 'name', (x)=>{return x}), "group_name_"+i.toFixed());
                elements.push(element);
            }
            
            { // Group delay
                const cell = document.createElement("div");
                const cell_text = document.createTextNode("Group delay (s) : ")
                const delay_element = getInputElement("number",group.delay, false, updateFieldFromInput(group, 'delay', parseFloat));

                cell.appendChild(cell_text);
                cell.appendChild(delay_element);
                cell.id = "group_delay_"+i.toFixed();
                elements.push(cell);
            }
            
            { // Download button
                const button = document.createElement("button");
                button.classList.add("icon_button");
                button.id = "group_download_button_"+i.toFixed();
                button.onclick = ()=>{this.env.exportGroup(i,this.env.planned_groups[i].name)}
                const cell_text = document.createTextNode("🖫"); //⭳
                
                button.appendChild(cell_text);
                elements.push(button);
            }
            { // Preview button
                const button = document.createElement("button");
                button.classList.add("icon_button");
                button.id = "group_preview_button_"+i.toFixed();
                button.onclick = ()=>{this.previewGroup(i)}
                const cell_text = document.createTextNode("👁");
                
                button.appendChild(cell_text);
                elements.push(button);
            }
            { // Delete button
                const button = document.createElement("button");
                button.classList.add("icon_button");
                button.id = "group_delete_button_"+i.toFixed();
                button.onclick = ()=>{
                    if(this.env.planned_groups[i].length==0 || window.confirm("This group is not empty. Are you sure you want to delete it?")){
                        this.env.planned_groups.splice(i,1);this.editEmitter();
                    }
                };
                const cell_text = document.createTextNode("╳");
                
                button.appendChild(cell_text);
                elements.push(button);
            }
            const button_width = 0.2/3;
            const row = getCustomRow(elements,[button_width,button_width, (1-button_width*5)/2., (1-button_width*5)/2.,button_width,button_width,button_width]);
            content_div.appendChild(row);
            group_div.appendChild(content_div);
        }
        
        
        const hr = document.createElement("hr");
        plan_div.appendChild(hr);
        
        if(group.length==0){
            const p = document.createElement("p");
            const text_element = document.createTextNode("Empty group");
            p.appendChild(text_element);
            plan_div.appendChild(p);
        }
        else{            
            const categories = ["Name",
                            "Origin [x] (pix)",
                            "Target [x,y] (pix)",
                            "Duration (s)",
                            "Delay (s)",
                            "Rocket time (s)"];
            const button_categories = ["Reroll","Edit","Preview","Delete"];
            const title_elements = [];
            const title_dims = [];
            for(const category of categories){
                title_elements.push(document_createBoldNode(category));
                title_dims.push(category=="Name" ? 0.2 : (0.8-button_categories.length*0.2/3)/(categories.length-1));
            }
            for(const category of button_categories){
                title_elements.push(document_createBoldNode(category));
                title_dims.push(0.2/3);
            }
            const rowTitle = getCustomRow(title_elements, title_dims);
            plan_div.appendChild(rowTitle);
            for (let j = 0; j < group.length; j++) {
                const hr = document.createElement("hr");
                plan_div.appendChild(hr);
                
                const emitRow = this.getEmitterRow(i,j,false);
                plan_div.appendChild(emitRow);
            }
        }
        content_div.appendChild(plan_div);
        
        return group_div;
    }
    
    editEmitter(i=-1,j=-1){
        this.cursor.off();
        this.selected_group = i;
        this.selected_emitter = j;
        this.update();
    }
    
    selectGroup(i=-1){
        this.editEmitter(i,-1);
    }
    
    previewEmitter(i,j){
        const emitter = this.env.planned_groups[i].emitters[j].copy();
        emitter.delay = 0.;
        this.env.emitters.push(emitter);
    }
    
    previewGroup(i){
        const emitters = this.env.planned_groups[i].emitters;
        for(const emitter of emitters){
            this.env.emitters.push(emitter.copy());
        }
    }
       
    getEmitterRow(i,j, edit=false){
        const disabled = !edit;
        const suffix = edit ? "_edit" : ("_"+i.toString()+"_"+j.toString());
        
        const emitter = this.env.planned_groups[i].emitters[j];
        
        const is_fixed = false;
        
        const elements = [];
        
        { // Name
            const input_element = getInputElement("text",emitter.name, is_fixed, is_fixed ? null : updateFieldFromInput(emitter, 'name', (x)=>{return x},()=>{this.updateEmitterRow(i,j,!edit);}));
            elements.push(input_element);
        }
        { // Origin
            const input_element = getInputElement("coords_button",emitter.pos.x.toFixed(2), is_fixed, is_fixed ? null : this.coordEditor.updateFromInput(emitter, 'origin',()=>{this.updateEditEmitterDiv();this.updateEmitterRow(i,j,!edit);}));
            elements.push(input_element);
        }
        { // Target
            const input_element = getInputElement("coords_button",emitter.target.x.toFixed(2)+", "+emitter.target.y.toFixed(2), is_fixed,
                                                  is_fixed ? null : this.coordEditor.updateFromInput(emitter, emitter.use_rocket ? 'target' : 'velocity',()=>{this.updateEditEmitterDiv();this.updateEmitterRow(i,j,!edit);}));
            elements.push(input_element);
        }
        { // Duration
            const input_element = getInputElement("number",emitter.duration, is_fixed, is_fixed ? null : updateFieldFromInput(emitter, 'duration', parseFloat,()=>{this.updateEmitterRow(i,j,!edit);}));
            elements.push(input_element);
        }
        { // Delay
            const input_element = getInputElement("number",emitter.delay, is_fixed, is_fixed ? null : updateFieldFromInput(emitter, 'delay', parseFloat,()=>{this.updateEmitterRow(i,j,!edit);}));
            elements.push(input_element);
        }
        { // Rocket time
            const input_element = emitter.use_rocket ? document.createTextNode(emitter.firework.makeRocket(emitter.pos, emitter.target, this.env.dampen).duration.toFixed(2))
                                                     : document.createTextNode("No rocket");
            elements.push(input_element);
        }
        const nb_elements = elements.length;
        // Buttons
        { // Reroll button
            const button = document.createElement("button");
            button.classList.add("icon_button");
            button.id = "emitter_reroll_button_"+suffix;
            button.onclick = ()=>{this.env.planned_groups[i].emitters[j] = emitter.reroll();this.updateEditEmitterDiv();};
            const dice = "⚀⚁⚂⚃⚄⚅";
            const dice_id = Math.floor(Math.random() * 6);
            const cell_text = document.createTextNode(dice[dice_id]);
            button.appendChild(cell_text);
            elements.push(button);
        }
        { // Edit button
            const button = document.createElement("button");
            button.classList.add("icon_button");
            button.id = "emitter_prop_editor_button_"+suffix;
            button.onclick = edit ? ()=>{this.selectGroup(this.selected_group)} : ()=>{this.editEmitter(i,j)}
            const cell_text = document.createTextNode(edit ? "✓" : "🖋");
            button.appendChild(cell_text);
            elements.push(button);
        }
        { // Preview button
            const button = document.createElement("button");
            button.classList.add("icon_button");
            button.id = "emitter_preview_button_"+suffix;
            button.onclick = ()=>{this.previewEmitter(i,j)}
            const cell_text = document.createTextNode("👁");
            button.appendChild(cell_text);
            elements.push(button);
        }
        { // Delete button
            const button = document.createElement("button");
            button.classList.add("icon_button");
            button.id = "emitter_delete_button_"+suffix;
            button.onclick = ()=>{this.env.planned_groups[i].remove(j);this.selectGroup(this.selected_group);};
            const cell_text = document.createTextNode("╳");
            button.appendChild(cell_text);
            elements.push(button);
        }
        const nb_buttons = elements.length - nb_elements;
        
        //const is_custom = isCustomProperty(data[field],type);
        
        const dims = [];
        for(let k = 0 ; k < nb_elements ; k++){
            dims.push(k===0 ? 0.2 : (0.8-nb_buttons*0.2/3)/(nb_elements-1));
        }
        for(let k = 0 ; k < nb_buttons ; k++){
            dims.push(0.2/3);
        }
        const row = getCustomRow(elements,dims);
        row.id = "emitter_row"+suffix;
        if(!edit && this.selected_group==i && this.selected_emitter==j){row.classList.add("selected_row"); row.classList.add("emitter");};
        return row;
    };
   
    updateEditEmitterDiv(){
    
        this.editEmitterDiv.innerHTML = "";
        
        if(this.selected_group<0 ||this.selected_emitter<0){
            return;
        }
        
        const title = document.createElement('h3');
        title.innerHTML = "Selected emitter";
        this.editEmitterDiv.appendChild(title);
        
        const edit_emitter_content_div = document.createElement("div");
        edit_emitter_content_div.classList.add("content_div");
        edit_emitter_content_div.classList.add("emitter");
        this.editEmitterDiv.appendChild(edit_emitter_content_div);
        
        const emitter = this.env.planned_groups[this.selected_group].emitters[this.selected_emitter];
        
        const categories = ["Name",
                            "Origin [x] (pix)",
                            "Target [x,y] (pix)",
                            "Duration (s)",
                            "Delay (s)",
                            "Rocket time (s)"];
        const button_categories = ["Reroll","Edit","Preview","Delete"];
        const title_elements = [];
        const title_dims = [];
        for(const category of categories){
            title_elements.push(document_createBoldNode(category));
            title_dims.push(category=="Name" ? 0.2 : (0.8-button_categories.length*0.2/3)/(categories.length-1));
        }
        for(const category of button_categories){
            title_elements.push(document_createBoldNode(category));
            title_dims.push(0.2/3);
        }
        const rowTitle = getCustomRow(title_elements, title_dims);
        edit_emitter_content_div.appendChild(rowTitle);

        const emitRow = this.getEmitterRow(this.selected_group,this.selected_emitter,true);
        edit_emitter_content_div.appendChild(emitRow);
        
        const fireworkDiv = this.getFireworkDataDiv(emitter.firework, emitter.template_data.firework, []);
        this.editEmitterDiv.appendChild(fireworkDiv);
        
    }
    
    updateEmitterRow(i,j,edit){
        if(edit && (this.selected_group!=i || this.selected_emitter!=j)){
            return;
        }
        const id = "emitter_row_"+(edit ? "edit" : (i.toFixed()+"_"+j.toFixed()));
        const emitRow = document.getElementById(id);
        emitRow.replaceWith(this.getEmitterRow(i,j,edit));
    }
    
    getCustomPropertyRow(data,field,label,type,depth,disabled=true){
            const row_label = document_createBoldNode(label);
            
            const row_input = type=="color" ? getInputElement('color', data[field].html(), disabled, updateColorFromInput(data,field), "firework_"+field+"_"+depth.join('_'))
                                            : getInputElement(type, data[field], disabled, updateFieldFromInput(data,field,type=="number" ? parseFloat : type=="integer" ? parseInt : null), "firework_"+field+"_"+depth.join('_'));
            
            const row = getCustomRow([row_label,row_input],[0.2,0.8]);
            
            return row;
        
    };
    
    getFireworkDataDiv(firework, template_data, depth=[]){
        const firework_data_div = document.createElement("div");
        
        const firework_content_div = document.createElement("div");
        firework_content_div.classList.add("content_div");
        firework_content_div.classList.add("firework");
        
        const firework_data_header = document.createElement("div");
        firework_data_header.classList.add("utils_div");
        
        const firework_properties_div = document.createElement('div');
        firework_properties_div.hidden = true;
        
        const trail_properties_div = document.createElement("div");
        
        {// Expand button
            const expand_button = document.createElement('button');
            expand_button.classList.add("icon_button");
            const expand_text = document.createTextNode("▶");
            expand_button.appendChild(expand_text);
            expand_button.onclick = ()=>{expand_button.innerHTML=firework_properties_div.hidden ? "▼" : "▶";firework_properties_div.hidden = !firework_properties_div.hidden};
            firework_data_header.appendChild(expand_button);
        }
        
        { // Shape
            const shape_div = document.createElement("div");
            const shape_label = document.createElement("label");
            const shape_label_text = document_createBoldNode("Shape: ");
            shape_label.appendChild(shape_label_text);
            const element = getInputElement("shape",Object.keys(Template._fireworkShapes_)[firework.shape], true, null);
            shape_label.appendChild(element);
            shape_div.appendChild(shape_label);
            firework_data_header.appendChild(shape_div);
        }
        { // Use trail
            const use_trail_div = document.createElement("div");
            const use_trail_text = document_createBoldNode(firework.trail!==null ? "Has a trail" : "No trail");
            use_trail_div.appendChild(use_trail_text);
            firework_data_header.appendChild(use_trail_div);
        }
        { // Nb cascades
            const nb_cascades_div = document.createElement("div");
            const nb_cascades_text = document_createBoldNode(firework.cascades.length.toFixed() + " cascade(s)");
            nb_cascades_div.appendChild(nb_cascades_text);
            firework_data_header.appendChild(nb_cascades_div);
        }
        firework_content_div.appendChild(firework_data_header);
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(firework,'bit_color','Bit color','color',depth,!isCustomProperty(template_data['bit_color'],'color'));
            firework_properties_div.append(row);
        }
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(firework,'duration','Duration','number',depth,!isCustomProperty(template_data['duration'],'number'));
            firework_properties_div.append(row);
        }
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(firework,'nb_bits','Nb bits','integer',depth,!isCustomProperty(template_data['nb_bits'],'integer'));
            firework_properties_div.append(row);
        }
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(firework,'projection_speed','Projection speed','number',depth,!isCustomProperty(template_data['projection_speed'],'number'));
            firework_properties_div.append(row);
        }
        
        if(firework.trail!==null){
            const trail = firework.trail;
            {
                const hr = document.createElement('hr');
                firework_properties_div.append(hr);
                const trail_text = document_createBoldNode("Trail");
                const row = getCustomRow([trail_text]);
                firework_properties_div.append(row);
            }
            {
                const hr = document.createElement('hr');
                firework_properties_div.append(hr);
                const row = this.getCustomPropertyRow(trail,'color','Trail color','color',depth,!isCustomProperty(template_data.trail['color'],'color'));
                firework_properties_div.append(row);
            }
            {
                const hr = document.createElement('hr');
                firework_properties_div.append(hr);
                const row = this.getCustomPropertyRow(trail,'radius','Trail radius','number',depth,!isCustomProperty(template_data.trail['radius'],'number'));
                firework_properties_div.append(row);
            }
            {
                const hr = document.createElement('hr');
                firework_properties_div.append(hr);
                const row = this.getCustomPropertyRow(trail,'dispersion','Trail dispersion','number',depth,!isCustomProperty(template_data.trail['dispersion'],'number'));
                firework_properties_div.append(row);
            }
            {
                const hr = document.createElement('hr');
                firework_properties_div.append(hr);
                const row = this.getCustomPropertyRow(trail,'amount','Trail amount','integer',depth,!isCustomProperty(template_data.trail['amount'],'integer'));
                firework_properties_div.append(row);
            }
            {
                const hr = document.createElement('hr');
                firework_properties_div.append(hr);
                const row = this.getCustomPropertyRow(trail,'delay','Trail delay','number',depth,!isCustomProperty(template_data.trail['delay'],'number'));
                firework_properties_div.append(row);
            }
            {
                const hr = document.createElement('hr');
                firework_properties_div.append(hr);
                if(trail.duration===null){
                    const row_label = document_createBoldNode("Trail duration");
                    const row_content = document.createTextNode("No duration limit");
                    const row = getCustomRow([row_label, row_content],[0.2, 0.8])
                    firework_properties_div.append(row);
                }
                else{
                    const row = this.getCustomPropertyRow(trail,'duration','Trail duration','number',depth,!isCustomProperty(template_data.trail['duration'],'number'));
                    firework_properties_div.append(row);
                }
            }
        }
        
        firework_content_div.appendChild(firework_properties_div);
        
        firework_data_div.appendChild(firework_content_div);
                
        const firework_cascades_div = document.createElement("div");
        firework_cascades_div.classList.add("shift");
        
        for(let i=0 ; i<firework.cascades.length ; i++){
            const cascade_div = this.getFireworkDataDiv(firework.cascades[i], template_data.cascades[i], depth.concat([i]));
            firework_cascades_div.appendChild(cascade_div);
        }
        
        firework_data_div.appendChild(firework_cascades_div);
        
        return firework_data_div;
    }
    
}

class TemplateEditor{
    constructor(env, template_manager, container){
        this.env = env;
        this.template_manager = template_manager;
        this.container = container;
        
        const utilsDiv = document.createElement("div");
        utilsDiv.classList.add("utils_div");
        const templateSelectorSpan = document.createElement("span");
        utilsDiv.appendChild(templateSelectorSpan);
        this.templateSelectorSpan = templateSelectorSpan;
        
        this.container.appendChild(document.createElement('br'));
        
        this.container.appendChild(utilsDiv);
        this.utilsDiv = utilsDiv;
        
        { // Import section
            const importSpan = document.createElement("span");
            
            const templateUploadButton = getUploadButton((e) => {
                const template_data = JSON.parse(e.target.result);
                this.template_manager.loadCustom(template_data);
                this.template_manager.selected_template = this.template_manager.length-1;
                this.update();
              }, "Load", ".ftemplate", true);
            
            importSpan.appendChild(templateUploadButton);
            
            {
                const env = this.env;
                const duplicateButton = document.createElement("button");
                duplicateButton.onclick = ()=> {
                    const template = this.template_manager.getSelected().copy();
                    this.template_manager.addCustom(template);
                    this.template_manager.selected_template = this.template_manager.length-1;
                    this.update();
                };
                const cell_text = document.createTextNode("Duplicate");
                duplicateButton.appendChild(cell_text);
                importSpan.appendChild(duplicateButton);
            }
              
            { // Download
                const template = this.template_manager.all();
                const saveButton = document.createElement("button")
                saveButton.onclick = ()=>{this.template_manager.export(this.template_manager.selected_template);}
                const cell_text = document.createTextNode("Save");
                saveButton.appendChild(cell_text);
                importSpan.appendChild(saveButton);
            }
              
            this.utilsDiv.appendChild(importSpan);
        }
    
        this.container.appendChild(document.createElement('hr'));
        
        const template_editor_div = document.createElement("div");
        template_editor_div.classList.add("edit_template_div");
        this.template_editor_div = template_editor_div;
        this.container.appendChild(this.template_editor_div);
        
    }
    hide(){
        this.container.hidden = true;
    }
    show(){
        this.update();
        this.container.hidden = false;
    }
    update(){
        this.updateTemplateSelector();
        this.updateEditorDiv();
    }
    updateTemplateSelector(){
        this.templateSelectorSpan.innerHTML = "";
        
        const template_selector = document.createElement("select");
        template_selector.classList.add((this.template_manager.selected_template<this.template_manager.base.length) ? 'base_option' : 'custom_option');
        template_selector.id = "template_selector_group";
        for(let k = 0 ; k<this.template_manager.length ; k++){
            if(k===(this.template_manager.base.length)){
                template_selector.appendChild(document.createElement('hr'));
            }
            const option = document.createElement("option");
            option.classList.add((k<this.template_manager.base.length) ? 'base_option' : 'custom_option');
            option.value = k;
            const optionText = document.createTextNode(this.template_manager.all()[k].name);
            option.appendChild(optionText);
            template_selector.appendChild(option);
        }
        template_selector.value = this.template_manager.selected_template;
        template_selector.addEventListener("input", ()=>{this.template_manager.selected_template=template_selector.value;this.update()});
        
        this.templateSelectorSpan.appendChild(template_selector);
    }
    
    updateEditorDiv(){
        this.template_editor_div.innerHTML = "";
        const template = this.template_manager.getSelected();
        const selected_id = this.template_manager.selected_template;
        
        const disabled = selected_id < this.template_manager.base.length;
        
        { // Name
            const templateNameSpan = document.createElement("span");
            const element = getInputElement("text",template.name, disabled, disabled ? null : updateFieldFromInput(template, 'name', (x)=>{return x}, ()=>{this.updateTemplateSelector();}),"template_name_input");
            templateNameSpan.appendChild(element);
            this.template_editor_div.appendChild(templateNameSpan);
        }
        
        if(disabled){
            this.template_editor_div.appendChild(document.createElement('br'));
            const warning_small = document.createElement('small');
            const warning_i = document.createElement('i');
            const warning_text = document.createTextNode('This is a default template. To edit it, first create a duplicate.');
            warning_i.appendChild(warning_text);
            warning_small.appendChild(warning_i);
            this.template_editor_div.appendChild(warning_small);
        }
    
        {
            const title = document.createElement('h3');
            title.innerHTML = "Template variables";
            const tooltip = document_createTooltip(document.createTextNode("Variables are user-defined values that can be called in any upcoming field. They can be useful to reuse the same durations across multiple fireworks, or to create more controlled random colors."));
            title.appendChild(tooltip);
            this.template_editor_div.appendChild(title);
        }
        
        const templateVariablesTable = this.getTemplateVariablesTable(selected_id,disabled);
        this.template_editor_div.appendChild(templateVariablesTable);
        
        {
            const title = document.createElement('h3');
            title.innerHTML = "Emitter";
            this.template_editor_div.appendChild(title);
        }
        
        const template_emitter_div = this.getTemplateEmitterDiv(selected_id,disabled);
        this.template_editor_div.appendChild(template_emitter_div);
        
        {
            const title = document.createElement('h3');
            title.innerHTML = "Fireworks";
            const tooltip_text = document.createTextNode("A firework charge corresponds to the projection of multiple bits (or fragments) when exploding. The cascades are the firework charges that will detonate from a bit when its lifspan is over.");
            const tooltip = document_createTooltip(tooltip_text);
            title.appendChild(tooltip);
            this.template_editor_div.appendChild(title);
        }
        
        const firework_div = this.getFireworkDataDiv(template.emitter.firework,[], disabled);
        this.template_editor_div.appendChild(firework_div);
        
        this.template_editor_div.appendChild(document.createElement('br'));
    }
    
    getVariableRow(template,index,disabled=true){
        const variable = template.variables[index];
        const suffix = index.toFixed;
        
        const cells = [];
        const input_name = getInputElement('text', variable[0], disabled, updateFieldFromInput(variable, 0, (x)=>{return x}, "variable_row_"+suffix));
        cells.push(input_name);
        const input_formula = getInputElement('text', variable[1], disabled, updateFieldFromInput(variable, 1, (x)=>{return x}, "variable_row_"+suffix));
        input_formula.classList.add("formula")
        cells.push(input_formula);
        
        if(!disabled){
            { // Up button
                const button = document.createElement("button");
                button.classList.add("icon_button");
                button.id = "variable_up_button_"+suffix;
                button.disabled = disabled || index<=0;
                button.onclick = ()=>{
                    [template.variables[index-1],template.variables[index]]=[template.variables[index],template.variables[index-1]];this.updateEditorDiv();
                };
                const cell_text = document.createTextNode("△");
                
                button.appendChild(cell_text);
                cells.push(button);
            }
            { // Down button
                const button = document.createElement("button");
                button.classList.add("icon_button");
                button.id = "variable_up_button_"+suffix;
                button.disabled = disabled || index>=template.variables.length-1;
                button.onclick = ()=>{
                    [template.variables[index+1],template.variables[index]]=[template.variables[index],template.variables[index+1]];this.updateEditorDiv();
                };
                const cell_text = document.createTextNode("▽");
                
                button.appendChild(cell_text);
                cells.push(button);
            }
            { // Delete button
                const button = document.createElement("button");
                button.classList.add("icon_button");
                button.id = "variable_delete_button_"+suffix;
                button.disabled = disabled;
                button.onclick = ()=>{
                    template.variables.splice(index,1);this.updateEditorDiv();
                };
                const cell_text = document.createTextNode("╳");
                
                button.appendChild(cell_text);
                cells.push(button);
            }
        }
        
        return getCustomRow(cells,[.2, .6])
    }
    
    getTemplateVariablesTable(i, disabled = true){
        const template = this.template_manager.all()[i];
        
        const templateVariablesBody = document.createElement("div");
        templateVariablesBody.classList.add("content_div");
        templateVariablesBody.classList.add("variables");
        
        { // Title row        
            const categories = disabled ? ["Name","Formula (Reverse Polish Notation)"] : ["Name","Formula (Reverse Polish Notation)", "Up", "Down", "Delete"];
            const titles = [];
            const rowTitle = document.createElement("tr");
            for(const category of categories){
                titles.push(document_createBoldNode(category));
            }
            const tooltip_div = document.createElement("div");
            const tooltip_text = document.createTextNode("Reverse Polish Notation is a postfix mathematical notation allowing to write formulas without the use of parenthesis. Access the ");
            const tooltip_a = document.createElement("a");
            tooltip_a.href = "/documentation/RPN";
            const tooltip_a_text =  document.createTextNode("list of available functions");
            tooltip_a.appendChild(tooltip_a_text);
            const tooltip_text_end = document.createTextNode(".");
            tooltip_div.appendChild(tooltip_text);
            tooltip_div.appendChild(tooltip_a);
            tooltip_div.appendChild(tooltip_text_end);
            
            const tooltip = document_createTooltip(tooltip_div);
            titles[1].appendChild(tooltip);
            templateVariablesBody.appendChild(getCustomRow(titles,[.2, .6]));
        }
        
        const ids = ["variable_name","variable_formula"];
        const edit_type = ["text","text"];
        
        for(let j=0 ; j<template.variables.length; j++){
            const hr = document.createElement('hr');
            templateVariablesBody.append(hr);
            templateVariablesBody.appendChild(this.getVariableRow(template,j,disabled));
        }
        if(template.variables.length==0){
            const hr = document.createElement('hr');
            templateVariablesBody.append(hr);
            const div = document.createElement("div");
            const text = document.createTextNode("No variable defined");
            div.appendChild(text);
            templateVariablesBody.appendChild(div)
        }
        
        if(!disabled){ // Add variable button
            const add_variable_button = document.createElement("button");
            add_variable_button.classList.add('wide');
            add_variable_button.classList.add('add_content_button');
            add_variable_button.disabled = disabled;
            add_variable_button.onclick = ()=>{template.variables.push([[],[]]);this.updateEditorDiv();};
            const add_variable_text = document.createTextNode("Add new variable");
            add_variable_button.appendChild(add_variable_text);
            templateVariablesBody.appendChild(add_variable_button);
        }
        
        
        return templateVariablesBody;
    }
    
    getTemplateEmitterDiv(i, disabled = true){
        const template = this.template_manager.all()[i];
        
        const template_emitter_div = document.createElement("div");
        template_emitter_div.classList.add('content_div');
        template_emitter_div.classList.add('emitter');
        const utils_div = document.createElement("div");
        utils_div.classList.add('utils_div');
        
        { // Duration
            const duration_label = document.createElement("label");
            
            const duration_text = document_createBoldNode("Duration: ");
            duration_label.appendChild(duration_text);
            
            const element = getInputElement("text",template.emitter.duration, disabled, disabled ? null : updateFieldFromInput(template.emitter, "duration", (x)=>{return x}), "template_duration_input");
            element.classList.add("formula");
            duration_label.appendChild(element);
            
            utils_div.appendChild(duration_label);
        }
        { // Use rocket
            const use_rocket_label = document.createElement("label");
            
            const use_rocket_text = document_createBoldNode("Use rocket? ");
            use_rocket_label.appendChild(use_rocket_text);
            
            const element = getInputElement("bool",template.emitter.use_rocket, disabled, disabled ? null : (e)=>{template.emitter.use_rocket=!template.emitter.use_rocket;}, "template_use_rocket_input");
            use_rocket_label.appendChild(element);
            
            utils_div.appendChild(use_rocket_label);
        }        
        template_emitter_div.appendChild(utils_div);
        
        return template_emitter_div;
    }
    
    getCustomPropertyRow(data,field,label,type,depth,disabled=true,tooltip=null){
        
            const row_label = document_createBoldNode(label);
            if(tooltip){
                row_label.appendChild(tooltip);
            }
            
            const is_custom = isCustomProperty(data[field],type);
            
            const row_custom_input = type=="color" ? (()=>{
                                                        const div = document.createElement("div");
                                                        
                                                        ["R","G","B","A"].forEach((c,i)=>{
                                                            const input = getInputElement("text", data[field][i], disabled, updateFieldFromInput(data[field],i,(x)=>{return x}), "firework_template_"+field+"_custom_"+depth.join('_'));
                                                            input.classList.add("formula");
                                                            div.appendChild(input);
                                                        });
                                                        return div;
                                                     })()
                                                   : (()=>{
                                                          const input = getInputElement("text", data[field], disabled, updateFieldFromInput(data,field,(x)=>{return x}), "firework_template_"+field+"_custom_"+depth.join('_'));
                                                          input.classList.add("formula");
                                                          return input;
                                                      })();
            
            const get_formula_row = ()=>{
                return type=="color" ? getCustomRow([row_label,(()=>{
                                                        const color_labels = document.createElement("div");
                                                        ["R","G","B","A"].forEach((c,i)=>{
                                                            const label_div = document.createElement("div");
                                                            const label = document.createTextNode(c);
                                                            label_div.classList.add("wide");
                                                            label_div.appendChild(label);
                                                            color_labels.appendChild(label_div);
                                                        });
                                                        color_labels.classList.add("column");
                                                        return color_labels;})(),row_custom_input],[0.2,0.1,0.7])
                                     : getCustomRow([row_label,row_custom_input],[0.2,0.8]);
            }
            if(is_custom){
                return get_formula_row();
            }
            if(!is_custom){
                const row_input = type=="color" ? getInputElement('color', Color.fromList(data[field]).html(), disabled, updateColorListFromInput(data,field), "firework_template_"+field+"_"+depth.join('_'))
                                                : getInputElement(type, data[field], disabled, updateFieldFromInput(data,field,type=="number" ? parseFloat : type=="integer" ? parseInt : null), "firework_template_"+field+"_"+depth.join('_'));
                
                const use_custom_button = document.createElement("button");
                use_custom_button.disabled = disabled;
                const cell_text = document.createTextNode("Use custom formula");
                use_custom_button.appendChild(cell_text);
                const row = disabled ? getCustomRow([row_label,row_input],[0.2,0.8])
                                     : getCustomRow([row_label,row_input,use_custom_button],[0.2,0.6,0.2]);
                use_custom_button.onclick = ()=>{row.replaceWith(get_formula_row())};
                
                return row;
            }
        
    };
    
    fillTrailDataRows(data, depth, disabled = true, container){        
        if(data==null){
            return;
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const trail_text = document_createBoldNode("Trail");
            const row = getCustomRow([trail_text]);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const row = this.getCustomPropertyRow(data,'color','Trail color','color',depth,disabled);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const row = this.getCustomPropertyRow(data,'radius','Trail radius','number',depth,disabled);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const row = this.getCustomPropertyRow(data,'dispersion','Trail dispersion','number',depth,disabled);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const row = this.getCustomPropertyRow(data,'amount','Trail amount','integer',depth,disabled);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const row = this.getCustomPropertyRow(data,'delay','Trail delay','number',depth,disabled);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            
            // Use duration limit
            const use_duration_limit_label = document.createElement("label");
            const use_duration_limit_text = document_createBoldNode("Use duration limit? ");
            use_duration_limit_label.appendChild(use_duration_limit_text);
            const use_duration_limit_tickbox = getInputElement("bool",(data.duration!==null).toString(), disabled, disabled ? null : (e)=>{data['duration'] = (data.duration===null) ? 1 : null; container.innerHTML=""; this.fillTrailDataRows(data, depth, disabled, container);}, "firework_template_trail_duration_tickbox_"+depth.join('_'));
            use_duration_limit_label.appendChild(use_duration_limit_tickbox);
            // Set duration limit
            
            const row_label = document_createBoldNode("Trail duration");
            
            if(data['duration']===null){
                const row = disabled ? getCustomRow([row_label,document.createTextNode("No duration limit")],[0.2,0.8])
                                     : getCustomRow([row_label,document.createTextNode("No duration limit"),use_duration_limit_label],[0.2,0.6,0.2]);
                container.append(row);
            }
            else{
                const is_custom = isCustomProperty(data['duration'],'number');
                
                const row_custom_input = (()=>{
                    const input = getInputElement("text", data['duration'], disabled, updateFieldFromInput(data,'duration',(x)=>{return x}), "firework_template_trail_duration_custom_"+depth.join('_'));
                    input.classList.add("formula");
                    return input;
                })();
                const get_formula_row = ()=>{
                    return disabled ? getCustomRow([row_label,row_custom_input],[0.2,0.8])
                                    : getCustomRow([row_label,row_custom_input,use_duration_limit_label],[0.2,0.6,0.2]);
                }
                if(is_custom){
                    container.append(get_formula_row());
                }
                else{
                    const row_input = getInputElement('number', data['duration'], disabled, updateFieldFromInput(data,'duration',parseFloat), "firework_template_trail_duration_"+depth.join('_'));
                    const use_custom_button = document.createElement("button");
                    use_custom_button.disabled = disabled;
                    const cell_text = document.createTextNode("Use custom formula");
                    use_custom_button.appendChild(cell_text);
                    const row = disabled ? getCustomRow([row_label,row_input],[0.2,0.8])
                                         : getCustomRow([row_label,row_input,use_custom_button,use_duration_limit_label],[0.2,0.4,0.2,0.2]);
                    use_custom_button.onclick = ()=>{row.replaceWith(get_formula_row())};
                    container.append(row);
                }
            }
        }
    }

    fillSmokeDataRows(data, depth, disabled = true, container){
        if(data==null){
            return;
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const smoke_text = document_createBoldNode("Smoke");
            const row = getCustomRow([smoke_text]);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const row = this.getCustomPropertyRow(data,'smoke_color','Smoke color','color',depth,disabled);
            container.append(row);
        }
        {
            const hr = document.createElement('hr');
            container.append(hr);
            const row = this.getCustomPropertyRow(data,'smoke_lifespan','Smoke lifespan','number',depth,disabled);
            container.append(row);
        }
    }

    getFireworkDataDiv(data, depth=[], disabled = true){
        
        const firework_data_div = document.createElement("div");
        
        const firework_content_div = document.createElement("div");
        firework_content_div.classList.add("content_div");
        firework_content_div.classList.add("firework");
        
        const firework_data_header = document.createElement("div");
        firework_data_header.classList.add("utils_div");
        
        const firework_properties_div = document.createElement('div');
        firework_properties_div.hidden = true;
        
        let use_custom_smoke = Template.checkCustomSmoke(data);
        const smoke_properties_div = document.createElement("div");
        smoke_properties_div.hidden = !use_custom_smoke;
        const trail_properties_div = document.createElement("div");
        
        {// Expand button
            const expand_button = document.createElement('button');
            expand_button.classList.add("icon_button");
            const expand_text = document.createTextNode("▶");
            expand_button.appendChild(expand_text);
            expand_button.onclick = ()=>{expand_button.innerHTML=firework_properties_div.hidden ? "▼" : "▶";firework_properties_div.hidden = !firework_properties_div.hidden};
            firework_data_header.appendChild(expand_button);
        }
        
        { // Shape
            const shape_div = document.createElement("div");
            const shape_label = document.createElement("label");
            const shape_label_text = document_createBoldNode("Shape: ");
            shape_label.appendChild(shape_label_text);
            const element = getInputElement("shape",data.shape, disabled, disabled ? null : updateFieldFromInput(data, 'shape', (x)=>{return x}), "firework_template_shape_"+depth.join('_'));
            shape_label.appendChild(element);
            shape_div.appendChild(shape_label);
            firework_data_header.appendChild(shape_div);
        }
        { // Use trail
            const use_trail_div = document.createElement("div");
            const use_trail_label = document.createElement("label");
            const use_trail_text = document_createBoldNode("Use trail? ");
            use_trail_label.appendChild(use_trail_text);
            const element = getInputElement("bool",(data.trail!==null).toString(), disabled, disabled ? null : (e)=>{data.trail = (data.trail===null) ? Template.getTrailTemplate([...data.bit_color]) : null; trail_properties_div.innerHTML=""; this.fillTrailDataRows(data.trail, depth, disabled, trail_properties_div)}, "firework_template_use_trail_input"+depth.join('_'));
            use_trail_label.appendChild(element);
            use_trail_div.appendChild(use_trail_label);
            firework_data_header.appendChild(use_trail_div);
        }   
        { // Use custom smoke
            const use_custom_smoke_div = document.createElement("div");
            const use_custom_smoke_label = document.createElement("label");
            const use_custom_smoke_text = document_createBoldNode("Use custom smoke? ");
            use_custom_smoke_label.appendChild(use_custom_smoke_text);
            const element = getInputElement("bool",use_custom_smoke.toString(), disabled, disabled ? null : (e)=>{if(use_custom_smoke){const default_smoke = Template.getDefaultSmoke();data.smoke_color = default_smoke.smoke_color ; data.smoke_lifespan = default_smoke.smoke_lifespan; smoke_properties_div.innerHTML=""; this.fillSmokeDataRows(data, depth, disabled, smoke_properties_div);}; smoke_properties_div.hidden = use_custom_smoke; use_custom_smoke=!use_custom_smoke;}, "firework_template_use_custom_smoke_input"+depth.join('_'));
            use_custom_smoke_label.appendChild(element);
            use_custom_smoke_div.appendChild(use_custom_smoke_label);
            firework_data_header.appendChild(use_custom_smoke_div);
        }  
        
        if(depth.length>0 && !disabled){ // Delete button
            const button = document.createElement("button");
            button.classList.add("icon_button");
            button.id = "cascade_delete_button_"+depth.join('_');
            button.onclick = ()=>{
                if(data.cascades.length==0 || window.confirm("All the nested cascades will also be deleted. Do you want to proceed?")){
                    let cascades = this.template_manager.getSelected().emitter.firework.cascades;
                    for(let i=0 ; i<depth.length-1 ; i++){
                        cascades = cascades[depth[i]].cascades;
                    }
                    cascades.splice(depth[depth.length-1],1);
                    this.updateEditorDiv();
                }
            };
            const cell_text = document.createTextNode("╳");
            
            button.appendChild(cell_text);
            firework_data_header.appendChild(button);
        } 
                
        firework_content_div.appendChild(firework_data_header);
        
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(data,'bit_color','Bit color','color',depth,disabled);
            firework_properties_div.append(row);
        }
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(data,'duration','Duration','number',depth,disabled);
            firework_properties_div.append(row);
        }
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(data,'nb_bits','Nb bits','integer',depth,disabled);
            firework_properties_div.append(row);
        }
        {
            const hr = document.createElement('hr');
            firework_properties_div.append(hr);
            const row = this.getCustomPropertyRow(data,'projection_speed','Projection speed','number',depth,disabled);
            firework_properties_div.append(row);
        }
        this.fillSmokeDataRows(data, depth, disabled, smoke_properties_div);
        firework_properties_div.append(smoke_properties_div);
        this.fillTrailDataRows(data.trail, depth, disabled, trail_properties_div);
        firework_properties_div.append(trail_properties_div);
        
        firework_content_div.appendChild(firework_properties_div);
        
        firework_data_div.appendChild(firework_content_div);
        
        if(!disabled){ // Add cascade button
            const add_cascade_button = document.createElement("button");
            add_cascade_button.classList.add('wide');
            add_cascade_button.classList.add('add_content_button');
            add_cascade_button.disabled = disabled;
            add_cascade_button.onclick = ()=>{const cascade_data = Template.getFireworkTemplate(); const cascade_div = this.getFireworkDataDiv(cascade_data, depth.concat([data.cascades.length]), disabled); data.cascades.push(cascade_data);firework_cascades_div.appendChild(cascade_div);};
            const add_cascade_text = document.createTextNode("Add new cascade");
            add_cascade_button.appendChild(add_cascade_text);
            firework_content_div.appendChild(add_cascade_button);
        }
        
        const firework_cascades_div = document.createElement("div");
        firework_cascades_div.classList.add("shift");
        
        for(let i=0 ; i<data.cascades.length ; i++){
            const cascade_div = this.getFireworkDataDiv(data.cascades[i], depth.concat([i]), disabled);
            firework_cascades_div.appendChild(cascade_div);
        }
        
        firework_data_div.appendChild(firework_cascades_div);
        
        return firework_data_div;
    }
}

export class EnvEditor{
    constructor(env, container){
        
        this.container = container;
        this.env = env;
        this.template_manager = new TemplatesManager(this.env,()=>{this.update()});
        
        /*
        const envtable_div = document.createElement("div");
        this.envtable_div = envtable_div;
        container.appendChild(envtable_div);
        this.envTable = new EnvTable(this.env, this.envtable_div);
        */
        const editor_div = document.createElement("div");
        this.editor_div = editor_div;
        
        const sequence_div = document.createElement("div");
        sequence_div.classList.add("tab_content");
        this.sequence_div = sequence_div;
        this.sequence_editor = new SequenceEditor(this.env, this.template_manager, this.sequence_div);
        
        const templates_div = document.createElement("div");
        templates_div.classList.add("tab_content");
        this.templates_div = templates_div;
        this.template_editor = new TemplateEditor(this.env, this.template_manager, this.templates_div);
        this.template_editor.hide();
        
        { // Tabs
            const tabs_span = document.createElement("span");
            tabs_span.classList.add("tabs");
            this.tabs_span = tabs_span;
            
            const sequence_tab = document.createElement("button");
            sequence_tab.id = "sequence_tab_button";
            sequence_tab.classList.add("tab_button");
            sequence_tab.classList.add("active_tab");
            sequence_tab.onclick = ()=>{sequence_tab.classList.add("active_tab");templates_tab.classList.remove("active_tab");this.sequence_editor.show();this.template_editor.hide();}
            const sequence_tab_text = document.createTextNode("Sequence editor");
            sequence_tab.appendChild(sequence_tab_text);
            tabs_span.appendChild(sequence_tab);
            
            const templates_tab = document.createElement("button");
            templates_tab.id = "templates_tab_button";
            templates_tab.classList.add("tab_button");
            templates_tab.onclick = ()=>{templates_tab.classList.add("active_tab");sequence_tab.classList.remove("active_tab");this.sequence_editor.selectGroup();this.template_editor.show();this.sequence_editor.hide();}
            const templates_tab_text = document.createTextNode("Template manager");
            templates_tab.appendChild(templates_tab_text);
            tabs_span.appendChild(templates_tab);
        
            this.editor_div.appendChild(tabs_span);
        }
        
        this.editor_div.appendChild(sequence_div);
        this.editor_div.appendChild(templates_div);
        {
            const p = document.createElement("p");
            const small = document.createElement("small");
            const textNode = document.createTextNode("Enter: play sequence");
            small.appendChild(textNode);
            p.appendChild(small);
            this.editor_div.appendChild(p);
        }
        {
            const p = document.createElement("p");
            const small = document.createElement("small");
            const textNode = document.createTextNode("Click on the board to preview the selected template.");
            small.appendChild(textNode);
            p.appendChild(small);
            this.editor_div.appendChild(p);
        }
        {
            const p = document.createElement("p");
            const small = document.createElement("small");
            const i = document.createElement("i");
            const textNode = document.createTextNode("Documentation about the editor will soon be available ");
            const a = document.createElement("a");
            const linkTextNode = document.createTextNode("here");
            a.appendChild(linkTextNode);
            a.href="./documentation"
            const endTextNode = document.createTextNode(".");
            i.appendChild(textNode);
            i.appendChild(a);
            i.appendChild(endTextNode);
            small.appendChild(i);
            p.appendChild(small);
            this.editor_div.appendChild(p);
        }
        
        {
            const display_editor_div = document.createElement("div");
            display_editor_div.classList.add('display_editor_div');
            this.display_editor_div = display_editor_div;
            /*
            const intro_p = document.createElement("p");
            const intro_text = document.createTextNode("Click on the board to create beautiful fireworks!");
            intro_p.appendChild(intro_text);
            this.display_editor_div.appendChild(intro_p);
            */
            const display_editor_button = document.createElement("button");
            display_editor_button.classList.add('wide');
            display_editor_button.onclick = ()=>{this.show();}
            const display_editor_text = document.createTextNode("Display editor");
            display_editor_button.appendChild(display_editor_text);
            this.display_editor_div.appendChild(display_editor_button);
            
            this.container.appendChild(this.display_editor_div);
        }
        
        this.hide();
        this.container.appendChild(this.editor_div);
        
        this.env.default_onclick = this.create_random_on_event();
        this.env.setOnclick();
        
        this.env.onDimUpdate = this.get_update_dims();
        this.env.updateCanvasDims(this.env.game_canvas.width,this.env.game_canvas.height);
        
        this.update();
        
    }
    
    hide(){
        this.editor_div.hidden = true;
        this.display_editor_div.hidden = false;
        this.env.default_onclick=this.create_random_on_event();
        this.env.setOnclick();
    }
    show(){
        this.editor_div.hidden = false;
        this.display_editor_div.hidden = true;
        this.env.default_onclick=this.create_selected_on_event();
        this.env.setOnclick();
    }
        
    get_update_dims(){
        return (width, height)=>{
            this.container.style['margin-top'] = "calc("+height.toString() + "px + 2em)";
            this.container.style.width = Math.round(this.env.resize_function(this.env.pixels_scale)[0]*this.env.pixels_scale).toString()+"px";
        }
    }
    
    update(){
        this.sequence_editor.update();
    }
    
    create_random_on_event(){
        return (e) => {
            const pos = this.env.getCursorPosition(e);
            
            const emitter = create_random_emitter_from_template(this.env, pos, this.template_manager.all());
            
            this.env.emitters.push(emitter);
            
            this.update();
        }
    }
    create_selected_on_event(){
        return (e) => {
            const pos = this.env.getCursorPosition(e);
            
            const emitter = create_random_emitter_from_template(this.env, pos, [this.template_manager.getSelected()]);
            
            this.env.emitters.push(emitter);
            
            this.update();
        }
    }
}
