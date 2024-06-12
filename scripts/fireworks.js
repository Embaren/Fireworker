import {parseFormula, Color, Point} from "/scripts/utils.js";

const BitType = {
  main: 0,
  trail: 1,
};

const FireworkShapesReverse = ["circle", "disk", "star4", "star5", "heart","square","spiral1L","spiral2L","spiral3L","spiral4L","spiral1R","spiral2R","spiral3R","spiral4R"];

const FireworkShapes = {}
for (let i=0 ; i<FireworkShapesReverse.length ; i++){
    FireworkShapes[FireworkShapesReverse[i]]=i;
}

class Trail{
  constructor(color=new Color(0,0,0,0), radius=1, lifespan=0, dispersion=0, amount=1, delay=0., duration=null){
    this.color = color;
    this.radius = radius;
    this.lifespan = lifespan;
    this.dispersion = dispersion;
    this.amount = Math.round(amount);
    this.delay = delay;
    this.duration = duration;
  }
  
  toJSON(){
    const data = {
      "color": this.color.list(),
      "radius": this.radius,
      "lifespan": this.lifespan,
      "dispersion": this.dispersion,
      "amount": this.amount,
      "delay": this.delay,
      "duration": this.duration
    };
    return data;
  }
  
}

function getStarDistFun(nb_points){
    return(x)=>(1.-Math.abs((x*nb_points/Math.PI)%2-1.)/2.);
}
function getSpiralDistFun(nb_branches,dir='L'){
    const mod = 2*Math.PI/nb_branches;
    return(x)=>(((x/mod) % 1)-(dir=='R'?1:0));
}

function getDistFun(shape_type = FireworkShapes.circle){
    switch(shape_type){
    case(FireworkShapes.circle):
        return (x)=>(1.);
        break;
    case(FireworkShapes.disk):
        return (x)=>(Math.random());
        break;
    case(FireworkShapes.directional):
        return (x)=>(0.);
        break;
    case(FireworkShapes.star4):
        return getStarDistFun(4);
        break;
    case(FireworkShapes.star5):
        return getStarDistFun(5);
        break;
    case(FireworkShapes.heart):
        return (x)=>(Math.sin(Math.abs((x % (2*Math.PI))-Math.PI))/2+Math.sin(Math.abs((x % (2*Math.PI))-Math.PI)/2)*Math.pow(Math.abs((x % (2*Math.PI))-Math.PI)/Math.PI,6)+.5);
        //return (x)=>(Math.pow((Math.exp(-Math.pow(Math.abs((x % (2*Math.PI))-Math.PI)-Math.PI/3,2))+Math.exp(Math.pow(Math.abs((x % (2*Math.PI))-Math.PI)-Math.PI/12,2)/12))/2,1.2));
        break;
    case(FireworkShapes["spiral1L"]):
        return getSpiralDistFun(1,"L");
    case(FireworkShapes["spiral2L"]):
        return getSpiralDistFun(2,"L");
    case(FireworkShapes["spiral3L"]):
        return getSpiralDistFun(3,"L");
    case(FireworkShapes["spiral4L"]):
        return getSpiralDistFun(4,"L");
    case(FireworkShapes["spiral1R"]):
        return getSpiralDistFun(1,"R");
    case(FireworkShapes["spiral2R"]):
        return getSpiralDistFun(2,"R");
    case(FireworkShapes["spiral3R"]):
        return getSpiralDistFun(3,"R");
    case(FireworkShapes["spiral4R"]):
        return getSpiralDistFun(4,"R");
    case(FireworkShapes["square"]):
        return (x)=>(Math.sqrt(1+2*(x/(Math.PI/2) % 1.)*((x/(Math.PI/2) % 1.)-1)));
    default:
        console.log("Invalid firework shape: not implemented yet. Default: circle");
        return (x)=>(1.);            
    }
}

class Bit {
  constructor(pos, vel, color, base_radius=1., legacy = 0., type=BitType.main, status = true){
    this.pos = pos;
    this.vel = vel;
    this.color = color;
    this.radius = base_radius;
    this.legacy = legacy;
    this.age = 0.;
    this.type = type;
    this.status = status;
  }
  newPos(framerate) {
    const scaled_vel = this.vel.scale(1./framerate);
    return(new Point(this.pos.x + scaled_vel.x, this.pos.y + scaled_vel.y));
  }
}

export class Firework {
  constructor(pos, bit_color, smoke_color, duration = 5., nb_bits = 1., smoke_lifespan = 1., projection_speed = 1., initial_velocity=null, cascades=[], trail=null, shape = FireworkShapes.circle, use_gravity = true) {
    this.pos = pos;
    this.bits = [];
    this.bit_color = bit_color;
    this.smoke_color = smoke_color;
    this.duration = duration;
    this.smoke_lifespan = smoke_lifespan;
    
    this.initial_velocity = initial_velocity === null ? new Point(0,0) : initial_velocity;
    this.projection_speed = projection_speed;
    this.progress = 0.;
    this.radius = 0.;
    this.nb_bits = Math.round(nb_bits);
    this.bit_decay = 24;
    this.cascades = cascades;
    
    this.trail = trail;
    this.shape = shape;
    this.use_gravity = use_gravity;
    
    const distFun = getDistFun(this.shape);
    
    const phase = Math.random() * 2 * Math.PI;
    for(let j = 0 ; j < this.nb_bits ; j ++){
      const angle = (j+(Math.random()-.5)/2.) * 2 * Math.PI / this.nb_bits + phase;
      const angle_phase = angle + phase;
      const speed = projection_speed+(Math.random()-.5)*12.;
      const vel = this.initial_velocity.add(new Point(Math.cos(angle_phase),Math.sin(angle_phase)).scale(speed*distFun(angle)));
      const bit = new Bit(pos,vel,bit_color,1.,0.,BitType.main,true);
      this.bits.push(bit);
    }
  }
  
  update(env_params) {
  
    this.progress = this.progress+1/env_params.framerate;
    
    const newBits = [];
    const newFireworks = [];
    
    const bit_instant_decay = this.bit_decay/env_params.framerate;
    
    for(let j = 0 ; j < this.bits.length ; j ++){
      switch(this.bits[j].type){
      case BitType.main:
          if(this.bits[j].age==0.){
          
            const bit = new Bit(this.bits[j].newPos(env_params.framerate),this.bits[j].vel.scale(env_params.dampen).add(this.use_gravity ? env_params.gravity : new Point(0,0)),this.bits[j].color,1.,this.bits[j].legacy+1./env_params.framerate*(1+(Math.random()-.5)/2.),BitType.main,true);
            
            if(this.bits[j].legacy > this.duration){
            
              bit.status = false;
              const age = this.progress - this.duration;
              const bit_progress = Math.round(age*env_params.framerate/Math.max(this.smoke_lifespan,env_params.framerate/2));
              bit.color = bit.color.addAlpha(this.smoke_color.scaleAlpha((1+bit_instant_decay)**bit_progress-1)).scaleAlpha(1/((1+bit_instant_decay)**bit_progress));
              
              if(this.bits[j].status){
                for(const cascade of this.cascades){
                    newFireworks.push(new Firework(this.bits[j].pos,cascade.bit_color,cascade.smoke_color,cascade.duration*(1+(Math.random()-.5)/10.),cascade.nb_bits,cascade.smoke_lifespan,cascade.projection_speed, this.bits[j].vel, cascade.cascades, cascade.trail, cascade.shape));
                }
              }
              //if((this.cascade !== null) && this.bits[j].status){
              //  newFireworks.push(new Firework(this.bits[j].pos,this.cascade.bit_color,this.cascade.smoke_color,this.cascade.duration*(1+(Math.random()-.5)/10.),this.cascade.nb_bits,this.cascade.smoke_lifespan,this.cascade.projection_speed, this.bits[j].vel, this.cascade.cascade, this.cascade.trail, this.cascade.type));
              //}
            }
            if(this.progress <= this.duration + this.smoke_lifespan){
              newBits.push(bit);
            }
                        
            if((this.trail !== null) && this.bits[j].status && this.progress>=this.trail.delay && ((this.trail.duration===null) || (this.progress<=(this.trail.delay+this.trail.duration)))){
              for(let k = 0 ; k < this.trail.amount ; k++){
                const angle = Math.random() * 2 * Math.PI;
                const trailDir = new Point(Math.cos(angle),Math.sin(angle));
                const trailPos = this.bits[j].newPos(env_params.framerate).add(trailDir.scale(this.trail.dispersion*(Math.random()**2)));
                const trailBit = new Bit(trailPos,this.bits[j].vel,this.trail.color,Math.max(this.trail.radius,0),0.,BitType.trail,false);
                newBits.push(trailBit);
              }
            }
          }
          this.bits[j].age = this.bits[j].age + (1.+(Math.random()-.5)*.1)/env_params.framerate;
          const bit_progress = this.bits[j].age/this.smoke_lifespan;
          this.bits[j].color = this.bits[j].color.addAlpha(this.smoke_color.scaleAlpha(bit_instant_decay)).scaleAlpha(1/(1+bit_instant_decay));
          this.bits[j].radius = this.bits[j].radius*(10**(1/env_params.framerate));
          if(this.bits[j].age >= this.smoke_lifespan){
            this.bits.splice(j,1);
            j = j-1;
          }
          break;
      case BitType.trail:
          this.bits[j].age = this.bits[j].age + (1.+(Math.random()-.5)*.1)/env_params.framerate;
          if(this.bits[j].age >= this.trail.lifespan){
            this.bits.splice(j,1);
            j = j-1;
          }
          break;
      default:
          break;
      }
    }
    this.bits = newBits.concat(this.bits);
    return([this.progress<(this.duration + 2.*this.smoke_lifespan),newFireworks]);
  }
  display(ctx) {
    for(const bit of this.bits){
      ctx.strokeStyle = bit.color.html();
      ctx.beginPath();
      ctx.arc(bit.pos.x, bit.pos.y, bit.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
  }
  makeRocket(origin, target, dampen=.5, end_speed=40.) {
    const difference = origin.scale(-1).add(target);
    const distance = difference.norm();
    
    const log_dampen = Math.log(dampen);
    const speed = end_speed-distance*log_dampen;
    const time = Math.log(distance*log_dampen/speed+1)/log_dampen;
    
    return new Firework(origin, new Color(.8, .8, .8, 1.), new Color(.2, .2, .2, .1), time, 1, .75, 0., difference.scale(speed/distance), [this], null, FireworkShapes.circle, false);
  }
  
  setTrail(trail){
      if(trail==="default"){
          this.trail = new Trail(this.bit_color.copy());
          return;
      }
      else if(trail==="blank"){
          this.trail = new Trail();
          return;
      }
      this.trail = trail;
  }
  
  toJSON(){
    const cascades_data = [];
    for(const cascade of this.cascades){
      cascades_data.push(cascade.toJSON());
    }
  
    const data = {
        "bit_color":this.bit_color.list(),
        "duration":this.duration,
        "nb_bits":this.nb_bits,
        "projection_speed":this.projection_speed,
        "shape": FireworkShapesReverse[this.shape],
        "smoke_color":this.smoke_color.list(),
        "smoke_lifespan":this.smoke_lifespan,
        "trail": this.trail === null ? null : this.trail.toJSON(),
        "cascades":cascades_data
    };
    return data;
  }
  
  static fromJSON(data, variables={}){
    const pos = data['pos']===undefined ? new Point(0,0) : Point.fromList(data['pos'], variables);
    const bit_color = Color.fromList(data['bit_color'], variables);
    const smoke_color = Color.fromList(data['smoke_color'], variables);
    const duration = parseFormula(data['duration'],variables);
    const nb_bits = parseFormula(data['nb_bits'],variables);
    const smoke_lifespan = parseFormula(data['smoke_lifespan'],variables);
    const projection_speed = parseFormula(data['projection_speed'],variables);
    const initial_velocity = data['initial_velocity']===undefined ? new Point(0,0) : Point.fromList(data['initial_velocity'],variables);
    
    const cascades = [];
    for(const cascade of data['cascades']){
      cascades.push(Firework.fromJSON(cascade,variables));
    }
    
    //const trail = (data['trail']=== null) ? null : new Trail.fromJSON(data['trail']);
    let trail = null;
    if(data['trail']!==null){
      const trail_r = (data['trail']['color'][0]==="FROM_BIT") ? bit_color.r : data['trail']['color'][0];
      const trail_g = (data['trail']['color'][1]==="FROM_BIT") ? bit_color.g : data['trail']['color'][1];
      const trail_b = (data['trail']['color'][2]==="FROM_BIT") ? bit_color.b : data['trail']['color'][2];
      const trail_a = (data['trail']['color'][3]==="FROM_BIT") ? bit_color.a : data['trail']['color'][3];
      trail = new Trail(new Color(trail_r,trail_g,trail_b,trail_a,variables), parseFormula(data['trail']['radius'],variables), parseFormula(data['trail']['lifespan'],variables), parseFormula(data['trail']['dispersion'],variables), parseFormula(data['trail']['amount'],variables), parseFormula(data['trail']['delay'],variables), data['trail']['duration']===null ? null : parseFormula(data['trail']['duration'],variables));
    }
    
    const shape = FireworkShapes[data['shape']];
    const use_gravity = data['pos']===undefined ? true : data['use_gravity'];
    
    return new Firework(pos, bit_color, smoke_color, duration, nb_bits, smoke_lifespan, projection_speed, initial_velocity, cascades, trail, shape, use_gravity);
  }
}

export class Emitter{
  constructor(pos, firework, name = "Emitter", target=null, delay = 0., duration=0., use_rocket = true, template_data=null, variables=null){
    this.name = name;
    this.pos = pos;
    this.firework = firework;
    this.duration = duration;
    this.delay = delay;
    this.age = 0.;
    this.target = target === null ? new Point(0,0) : target;
    this.use_rocket = use_rocket;
    this.template_data = template_data;
    this.variables = variables;
  }
  emit(dampen){
    if(this.age < this.delay){
      return null;
    }
    const end_speed = 20;
    const new_firework = this.use_rocket ? this.firework.makeRocket(this.pos, this.target, dampen, end_speed)
                                         : new Firework(this.pos, this.firework.bit_color, this.firework.smoke_color, this.firework.duration*(1+(Math.random()-.5)/10.), this.firework.nb_bits,
                                                        this.firework.smoke_lifespan, this.firework.projection_speed, this.pos.scale(-1).add(this.target), this.firework.cascades, this.firework.trail, this.firework.shape, this.firework.use_gravity);
    return new_firework;
  }
  update(framerate){
    this.age = this.age + 1/framerate
    return this.age<Math.ceil((this.delay+this.duration)*framerate)/framerate+1/framerate;
  }
  addDelay(delay){
      this.delay = this.delay + delay;
  }
  copy(){
      return Object.assign(new Emitter, this);
  }
    
  toJSON(){
    const data = {
      "name": this.name,
      "pos": this.pos.list(),
      "target": this.target.list(),
      "delay": this.delay,
      "duration": this.duration,
      "use_rocket": this.use_rocket,
      "firework": this.firework.toJSON(),
      "variables": this.variables,
      "template_data": this.template_data
    };
    return data;
  }
  
  reroll(){
    if(this.template_data!==null){
        const template_data = this.template_data;
        const data = this.copy().toJSON();
        data['firework'] = template_data['firework'];
        data['duration'] = template_data['duration'];
        return Emitter.fromJSON(data);
    }
    else{
        return this.copy();
    }
  }
    
  static fromJSON(data){
    const variables = data['variables'];
    const template_data = data['template_data'];
    
    const parsed_variables = {};
    for(const v of variables){
        const v_name = v[0];
        const v_formula = v[1];
        const value = parseFormula(v_formula, parsed_variables);
        parsed_variables[v_name] = value;
    }
    
    const name = data['name'];
    const pos = data['pos']===undefined ? new Point(0,0) : Point.fromList(data['pos'], parsed_variables);
    const firework = Firework.fromJSON(data['firework'], parsed_variables);
    const target = data['target']===undefined ? new Point(0,0) : Point.fromList(data['target'], parsed_variables);
    const delay = parseFormula(data['delay'], parsed_variables);
    const duration = parseFormula(data['duration'], parsed_variables);
    const use_rocket = data['use_rocket'];
        
        
    return new Emitter(pos, firework, name, target, delay, duration, use_rocket, template_data, variables);
  }
}

export class Template{
    constructor(name, emitter, variables=[], env = null){
        this.name = name;
        this.env = env;
        this.variables = variables;
        this.count_instances = 0;
        if(emitter){
            this.emitter = emitter;
        }
        else{
            const blank_firework = new Firework(new Point(0,0), new Color(1., 1., 1., 1.), new Color(.2, .2, .2, .2), 5., 5., 1., 1., null, [], null, FireworkShapes.circle, true);
            const blank_emitter = new Emitter(new Point(0,0), blank_firework, "Placeholder", null, 0., 0., true);
            this.emitter = blank_emitter;
        }
    }
    toJSON(){
        return {
            "name": this.name,
            "variables": this.variables,
            "emitter": this.emitter
        };
    }
  
            
    static _fireworkShapes_ = FireworkShapes;

    static getTrailTemplate(color=[0,0,0,0], radius=1, lifespan=0, dispersion=0, amount=1, delay=0., duration=null){
        return {
                "color": color,
                "radius": radius,
                "lifespan": lifespan,
                "dispersion": dispersion,
                "amount": amount,
                "delay": delay,
                "duration": duration
            }
    };
    
    static getFireworkTemplate(bit_color=[1,1,1,1], duration=2.5, nb_bits=7, projection_speed=10, shape='circle', smoke=null, trail=null, cascades=[]){
        
        smoke = smoke ? smoke : Template.getDefaultSmoke();
        
        return {
                "bit_color": bit_color,
                "duration": duration,
                "nb_bits": nb_bits,
                "projection_speed": projection_speed,
                "shape": shape,
                "smoke_color": smoke['smoke_color'],
                "smoke_lifespan": smoke['smoke_lifespan'],
                "trail": trail,
                "cascades": cascades
            }
    };
    
    static getEmitterTemplate(duration=0,use_rocket=true,firework_data=null){
        return {
            "duration":duration=0,
            "use_rocket":true,
            "firework": firework_data ? firework_data : Template.getFireworkTemplate()
            }
    }
    
    static getDefaultSmoke(){
        return {
            "smoke_color": [
                0.2,
                0.2,
                0.2,
                0.1
            ],
            "smoke_lifespan": 1.
        }
    }
    
    static checkCustomSmoke(firework_data){
        let isDefault = firework_data["smoke_lifespan"]===1;
        isDefault = isDefault && firework_data["smoke_color"][0] == 0.2;
        isDefault = isDefault && firework_data["smoke_color"][1] == 0.2;
        isDefault = isDefault && firework_data["smoke_color"][2] == 0.2;
        isDefault = isDefault && firework_data["smoke_color"][3] == 0.1;
        return !isDefault;
    }
    
    static load(data, env=null){
        
        //data = 
        const name = data['name'];
        const variables = data['variables'];
        
        return new Template(name, data['emitter'], variables, env);
    }
    copy(){
        return new Template(this.name+" (copy)", JSON.parse(JSON.stringify(this.emitter)), JSON.parse(JSON.stringify(this.variables)), this.env);
    }
    
    getEmitter(origin, target, delay=0){
        const emitter_name = this.name+" "+this.count_instances.toString();
        
        this.count_instances++;
        
        const emitter_data = Object.assign({}, this.emitter);
        emitter_data.name = emitter_name;
        emitter_data.pos = origin.list();
        emitter_data.target = target.list();
        emitter_data.delay = delay;

        const variables = {};
        if(this.env){
            variables["FRAMERATE"] = this.env.framerate;
        }
        
        for(const v of this.variables){
            const v_name = v[0];
            const v_formula = v[1];
            variables[v_name] = v_formula;
        }
        
        emitter_data.variables = this.copy().variables;
        if(this.env){
            emitter_data.variables.unshift(["FRAMERATE",this.env.framerate]);
        }
        emitter_data.template_data = this.copy().toJSON().emitter;
        
        const emitter = Emitter.fromJSON(emitter_data);
        return emitter;
    }
}
