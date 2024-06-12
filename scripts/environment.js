import {Point, Color, downloadJSON} from "/scripts/utils.js";
import {Emitter} from "/scripts/fireworks.js";

export class EmitterGroup{
    constructor(name="Group",delay=0.,emitters=[]){
        this.delay=delay;
        this.emitters=emitters;
        this.name = name;
        this.length=this.emitters.length;
    }
    push(emitter){
        this.emitters.push(emitter);
        this.updateLength();
    }
    remove(i){
        this.emitters.splice(i,1);
        this.updateLength();
    }
    updateLength(){
        this.length = this.emitters.length;
    }
    toJSON(){
        const emitters_data = []
        for(const emitter of this.emitters){
            emitters_data.push(emitter.toJSON());
        }
        return {
            "name":this.name,
            "delay":this.delay,
            "emitters":emitters_data
        }
    }
    static fromJSON(data){
        const emitters = [];
        for(const emitter_data of data.emitters){
            emitters.push(Emitter.fromJSON(emitter_data));
        }
        return new EmitterGroup(data.name,data.delay,emitters);
    }
}

class Text{
    constructor(content,pos,duration,font,color=new Color(1,1,1),fade=[0.,0.]){
        this.content = content;
        this.pos = pos;
        this.color = color;
        this.duration = duration;
        this.font = font;
        this.progress = 0;
        this.fade = fade;
    }
    update(framerate){
        this.progress = this.progress+1/framerate;
        return this.progress<this.duration;
    }
    display(ctx){
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        const color = this.color.copy();
        if(this.progress<this.fade[0]){
            color.a = color.a*this.progress/this.fade[0];
        }
        if((this.duration-this.progress)<this.fade[1]){
            color.a = color.a*(this.duration-this.progress)/this.fade[1];
        }
        ctx.fillStyle = color.html();
        ctx.font = this.font;
        ctx.fillText(this.content, this.pos.x, this.pos.y);
    }
}

export class Environment{
    constructor(canvas_id, create_canvas_group = false, framerate = 12, dampen = .95, gravity = new Point(.01,-.1), pixels_scale = 1, resize_function = null){
        
        this.pixels_scale = pixels_scale;
        
        if(create_canvas_group){
            this.canvas_group = document.createElement('div');
            this.canvas_group.id = canvas_id;
            this.canvas_group.style.position = "relative";
            
            this.background_canvas = document.createElement('canvas');
            this.background_canvas.classList.add('background_layer');
            this.game_canvas = document.createElement('canvas');
            this.game_canvas.classList.add('game_layer');
            
            this.canvas_group.appendChild(this.background_canvas);
            this.canvas_group.appendChild(this.game_canvas);
        }
        else{
            this.canvas_group = document.getElementById(canvas_id);
            this.background_canvas = this.canvas_group.getElementsByClassName('background_layer')[0]
            this.game_canvas = this.canvas_group.getElementsByClassName('game_layer')[0]
        }
        
        this.bg_ctx = this.background_canvas.getContext("2d");
        this.ctx = this.game_canvas.getContext("2d");
        this.framerate = framerate;
        this.dampen = dampen;
        this.gravity = gravity;
        this.play_status = false;
        this.planned_emitters = [];
        this.planned_groups = [new EmitterGroup("Default group")];
        this.emitters = [];
        this.fireworks = [];
        this.step_functions = [];
        
        this.texts = [];
        
        this.resize_function = resize_function;
        
        if(this.resize_function !== null){
            const size = this.resize_function(this.pixels_scale);
            this.updateCanvasDims(size[0], size[1]);
        }
    }
    
    writeText(content,pos,duration,font,color = new Color(1.,1.,1.), fade=[0.,0.]){
        const new_pos = pos.copy();
        new_pos.y = -new_pos.y;
        this.texts.push(new Text(content,new_pos,duration,font,color,fade));
    }
    
    updateCanvasDims(width, height){
        const component_width = Math.round(width*this.pixels_scale);
        const component_height = Math.round(height*this.pixels_scale);
        this.canvas_group.style.width = component_width.toString()+"px";
        this.canvas_group.style.height = component_height.toString()+"px";

        for(const canvas of [this.game_canvas,this.background_canvas]){
        
            if(canvas.width != width || canvas.height!=height){
                canvas.width = width;
                canvas.height = height;
                canvas.style.width = component_width.toString()+"px";
                canvas.style.height = component_height.toString()+"px";
            }
        }
        
        this.draw_background();
        
        if(this.onDimUpdate != null){
            this.onDimUpdate(component_width, component_height);
        }
    }
    execute(){
        for(const group of this.planned_groups){
            for(const emitter of group.emitters){
                const copy = emitter.copy();
                copy.addDelay(group.delay);
                this.emitters.push(copy);
            }
        }
    }
    play(){
        if(!this.play_status){
            this.play_status = true;
            this.step();
        }
        //this.canvas.addEventListener('mousedown', this.onclick);
    }
    pause(){
        this.play_status = false;
        //this.canvas.removeEventListener('mousedown', this.onclick);
    }
    
    draw_background(){
        const width = this.background_canvas.width;
        const height = this.background_canvas.height;
    
        // Background            
        this.bg_ctx.fillStyle = "black";
        this.bg_ctx.fillRect(0, 0, width, height);
        
        const grd = this.ctx.createLinearGradient(0, Math.round(height/2), 0, Math.round(3*height/2));
        grd.addColorStop(0, "black");
        grd.addColorStop(1, "DarkSlateBlue");
        this.bg_ctx.fillStyle = grd;
        this.bg_ctx.fillRect(0, Math.round(height/2), width, height);
    }
    step(){
        
        if(this.resize_function !== null){
            const size = this.resize_function(this.pixels_scale);
            if(!(this.game_canvas.width==size[0] && this.game_canvas.height==size[1])){
                this.updateCanvasDims(size[0], size[1]);
            }
        }
        
        const width = this.game_canvas.width;
        const height = this.game_canvas.height;
        
        this.ctx.save();
        
        // Use the identity matrix while clearing the canvas
        this.ctx.clearRect(0, 0, width, height);
        
        this.ctx.translate(width/2, height);
        this.ctx.scale(1,-1);
        
        for(let i = 0 ; i < this.emitters.length ; i ++){
          const new_firework = this.emitters[i].emit(this.dampen);
          if(new_firework!==null){
            this.fireworks.push(new_firework);
          }
          const alive = this.emitters[i].update(this.framerate);
          if(!alive){
            this.emitters.splice(i,1);
            i = i-1;
          }
        }
        
        const newFireworks = [];
        
        const params = {
            framerate: this.framerate,
            dampen: this.dampen**(1/this.framerate),
            gravity: this.gravity.scale(1./this.framerate),
        }
        
        for(let i = 0 ; i < this.fireworks.length ; i ++){
          this.fireworks[i].display(this.ctx);
          const [alive, newLocalFireworks] = this.fireworks[i].update(params);
          newFireworks.push(...newLocalFireworks);
          if(!alive){
            this.fireworks.splice(i,1);
            i = i-1;
          }
        }
        
        if(this.texts.length>0){
            this.ctx.save();
            this.ctx.scale(1, -1);
            for(let i = 0 ; i < this.texts.length ; i ++){
              this.texts[i].display(this.ctx);
              const alive = this.texts[i].update(this.framerate);
              if(!alive){
                this.texts.splice(i,1);
                i = i-1;
              }
            }
            this.ctx.restore();
        }
        
        for(let i = 0 ; i < this.step_functions.length ; i++){
          const keep = this.step_functions[i]();
          if(!keep){
            this.step_functions.splice(i,1);
            i = i-1;
          }
        }
        
        this.ctx.restore();
        
        this.fireworks.push(...newFireworks);
        
        if(this.play_status){
            setTimeout(()=>{this.step()},1000/this.framerate);
        }
    }
    
    getCursorPosition(event) {
        const rect = this.game_canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left)/this.pixels_scale-this.game_canvas.width/2;
        const y = -(event.clientY - rect.top)/this.pixels_scale+this.game_canvas.height;
        return new Point(x,y);
    }

    setOnclick(onclick_fun=null){
        this.game_canvas.removeEventListener('mousedown', this.onclick);
        if(!onclick_fun || onclick_fun=="default"){
            this.onclick = this.default_onclick;
        }
        else{
            this.onclick = onclick_fun;
        }
        this.onclick ? this.game_canvas.addEventListener('mousedown', this.onclick) : null;
    }
    
    loadGroup(data){
        const group = new EmitterGroup();
        for(const emitter_data of data){
            group.push(Emitter.fromJSON(emitter_data));
        }
        this.planned_groups.push(group);
    }
    
    exportGroup(i, fileName){
        const data=this.planned_groups[i].toJSON().emitters;
        downloadJSON(data,fileName,"fgroup");
    }
    
    loadSequence(data){
        for(const group_data of data){
            this.planned_groups.push(EmitterGroup.fromJSON(group_data));
        }
    }
    
    createGroup(name="Group",delay=0.,emitters=[]){
        this.planned_groups.push(new EmitterGroup(name,delay,emitters));
    }
    
    exportSequence(fileName){
        const data=[];
        for(const group of this.planned_groups){
            data.push(group.toJSON());
        }
        downloadJSON(data,fileName,"fsequence");
    }
}

