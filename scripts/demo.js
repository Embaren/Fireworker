import {Color, Point} from "/scripts/utils.js";
import {Environment} from "/scripts/environment.js";
import {Template} from "/scripts/fireworks.js";

export class DemoTemplatesManager{
    constructor(postLoading = (dtm)=>{}){
        this.postLoading = postLoading;
        this.demos_templates = {};
        this.custom = [];
        this.length = 0;
        this.loaded = fetch('/resources/example_templates/list.json')
            .then((response) => {return response.json()})
            .then((list) => {
                const promises = [];
                for(const template_name of list){
                    promises.push(fetch('/resources/example_templates/'+template_name+'.ftemplate')
                        .then((response) => response.json())
                        .then((json) => {const template = Template.load(json);this.demos_templates[template.name] = template;this.length+=1;})
                        );
                }
                return Promise.all(promises);
            });
    }
    get(key){
        return this.loaded.then(()=>{return this.demos_templates[key]});
    };
}

function getDemoEnv(id, dims){
    //                     canvas ID, create new canvas?, framerate, dampen (over 1s),  gravity (over 1s), pixels_scale,  rescale function
    return new Environment(       id,               true,        12,              .45, new Point(2.,-20.),            2, (pixels_scale)=>{return dims;});
}

function computeTotalFireworkDuration(firework){
    const base_duration = Math.max(firework.duration,0);
    let longest_element = Math.max(2*firework.smoke_lifespan,0);
    for(const cascade of firework.cascades){
        longest_element = Math.max(longest_element,computeTotalFireworkDuration(cascade));
    }
    return base_duration+longest_element;
}
function computeTotalEmitterDuration(emitter){
    let duration = Math.max(emitter.duration,0);
    return duration+computeTotalFireworkDuration(emitter.emit());
}

export const demo_default_dims = [100,100];

export class Demo{
    static instance_id = 0;
    constructor(container, titles, templates, dims=demo_default_dims){
        this.container = container;
        this.dims = dims;
        this.templates = templates;
        this.titles = titles;
        
        const id = "demo_"+Demo.instance_id.toFixed();
        Demo.instance_id = Demo.instance_id+1;
        this.env = getDemoEnv(id, dims);
        this.env.canvas_group.style.height = (dims[0]*this.env.pixels_scale).toFixed()+"px";
        this.env.canvas_group.style.width = (dims[1]*this.env.pixels_scale).toFixed()+"px";
        
        const demo_div = document.createElement("div");
        demo_div.classList.add("demo");
        demo_div.style.width = (dims[1]*this.env.pixels_scale).toFixed()+"px";
        this.demo_div = demo_div;
        
        demo_div.appendChild(this.env.canvas_group);
        this.create_buttons();
        
        this.container.appendChild(this.demo_div);
    }
    create_buttons(){
        this.buttons_list = []
        for(let i = 0 ; i < this.templates.length ; i++){
            const demo_button = document.createElement("button");
            this.buttons_list.push(demo_button);
            demo_button.classList.add("wide");
            demo_button.appendChild(document.createTextNode(this.titles[i]));
            const on_click = ()=>{
                for(const button of this.buttons_list){
                    button.disabled=true;
                }
                const emitter = this.createEmitter(i);
                let total_duration = computeTotalEmitterDuration(emitter)*1.15;
                this.env.emitters.push(emitter);
                this.env.play();
                setTimeout(()=>{
                    this.env.pause();
                    for(const button of this.buttons_list){
                        button.disabled=false;
                    }
                },total_duration*1000);
            }
            demo_button.onclick = on_click
            
            this.demo_div.appendChild(demo_button);
        }
    }
    createEmitter(i){
        const origin = new Point(0.,0.);
        const pos = new Point(0.,this.dims[0]/2);
        
        try{
            const emitter = this.templates[i].getEmitter(origin, pos);
            return emitter;
        }
        catch(err){
            window.alert('The emitter could not be created from template "'+this.templates[i].name+'" due to the following error:\n\n'+err);
        }
    }
    static fromDTMKeys(container,titles,keys,dtm){
        const promises = [];
        for(const key of keys){
            promises.push(dtm.get(key));
        }
        Promise.all(promises).then((templates)=>{return new Demo(container,titles, templates);});
    }
}
