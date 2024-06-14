import {Demo, DemoTemplatesManager} from "/scripts/demo.js";
import {document_createTooltip} from "/scripts/DOMutils.js";


const dtm = new DemoTemplatesManager();

const parametersDoc = {
    "cascade": {
        "name": "Cascade",
        "description": "Cascades are secondary charges that explode when a fragment's lifespan comes to the end.",
        "demo": {
            "names":["No cascade","One cascade (blue charge)"],
            "sources":["Demo Bare", "Demo Cascade"]
        }
    },
    "emitter_duration": {
        "name": "Emitter duration (s)",
        "description": "The emitter duration defines an instantaneous (when equals to 0) or a continuous (when greater than 0) emission.",
        "demo": {
            "names":["Instantaneous (duration=0s)","Continuous (duration=1s)"],
            "sources":["Demo Bare", "Demo Continuous"]
        }
    },
    "fragment_lifespan": {
        "name": "Fragment lifespan (s)",
        "description": "The fragments have a lifespan before decaying, corresponding to the duration of the firework.",
        "demo": {
            "names":["Red fragments","White fragments"],
            "sources":["Demo Bare", "Demo White"]
        }
    },
    "head_color": {
        "name": "Head color",
        "description":"The color of the projected fragments. Can be different from the trail color.",
        "demo": {
            "names":["Red fragments","White fragments"],
            "sources":["Demo Bare", "Demo White"]
        }
    },
    "nb_bits": {
        "name": "Nb of fragments",
        "description": "The number of fragments projected when the charge ignites.",
        "demo": {
            "names":["Abundant charge","Sparse charge"],
            "sources":["Demo Bare", "Demo Sparse"]
        }
    },
    "projection_speed": {
        "name": "Fragment projection speed (px/s)",
        "description": "The higher the projection speed, the bigger the firework!",
        "demo": {
            "names":["Large charge","Small charge"],
            "sources":["Demo Bare", "Demo Small"]
        }
    },
    "rocket": {
        "name": "Rocket",
        "description": "A rocket brings the charge at the target position for it to explode. In absence of a rocket, the emitter will ignite the charge from the origin, with an initial velocity.",
        "demo": {
            "names":["No rocket","Rocket"],
            "sources":["Demo Spray", "Demo Bare"]
        }
    },
    "rocket_time": {
        "name": "Rocket time (s)",
        "description": "A rocket brings the charge at the target position for it to explode. In absence of a rocket, the emitter will ignite the charge from the origin, with an initial velocity.",
        "demo": {
            "names":["No rocket","Rocket"],
            "sources":["Demo Spray", "Demo Bare"]
        }
    },
    "shape": {
        "name": "Shape",
        "description": "A charge can project fragments following different shapes.",
        "demo": {
            "names":["Circle","Star"],
            "sources":["Demo Bare", "Demo Star"]
        }
    },
    "trail": {
        "name": "Trail",
        "description": "Trails are particles that are left behind a fragment's head. More details in the 'Trail' documentation section.",
        "demo": {
            "names":["No trail","Green trail"],
            "sources":["Demo Bare", "Demo Trail"]
        }
    },
    "trail_amount": {
        "name": "Trail particles amount",
        "description": "Each frame, a defind amount of particles are emitted around the fragment's head.",
        "demo": {
            "names":["Sparse trail","Abundant trail"],
            "sources":["Demo Trail", "Demo Trail Abundant"]
        }
    },
    "trail_color": {
        "name": "Trail particles color",
        "description": "Trails can have a color different from the fragment head.",
        "demo": {
            "names":["Green trail","White trail"],
            "sources":["Demo Trail", "Demo Trail White"]
        }
    },
    "trail_delay": {
        "name": "Trail delay (s)",
        "description": "How long before the fragment starts to emits its trail.",
        "demo": {
            "names":["Instant trail (delay=0s)","Late trail (delay=1s)"],
            "sources":["Demo Trail", "Demo Trail Late"]
        }
    },
    "trail_duration": {
        "name": "Trail maximum duration (s)",
        "description": "Maximum duration of emission of a trail.",
        "demo": {
            "names":["Trail with no duration limit","Trail stopping early"],
            "sources":["Demo Trail", "Demo Trail Early"]
        }
    },
    "trail_dispersion": {
        "name": "Trail particles dispersion (px)",
        "description": "The trail particles are generated at each frame around the fragment's head, inside a dispersion radius.",
        "demo": {
            "names":["Narrow trail","Wide trail"],
            "sources":["Demo Trail", "Demo Trail Wide"]
        }
    },
    "trail_lifespan": {
        "name": "Trail particles lifespan (s)",
        "description": "Each trail particle remains static at its spawning location for a duration equal to its lifespan.",
        "demo": {
            "names":["Long trail particles","Short trail particles"],
            "sources":["Demo Trail", "Demo Trail Short"]
        }
    },
    "trail_radius": {
        "name": "Trail particles radius (px)",
        "description": "A trail particle is represented by a circle of a specified radius.",
        "demo": {
            "names":["Small trail particles","Large trail particles"],
            "sources":["Demo Trail", "Demo Trail Ring"]
        }
    },
}

export function getParameterDoc(key){
    if(key in parametersDoc){
        const parameterDoc = parametersDoc[key];
        const demo_div = document.createElement("div");
        Demo.fromDTMKeys(demo_div,parameterDoc.demo.names,parameterDoc.demo.sources, dtm)
        return {
            "name":parameterDoc.name,
            "description":parameterDoc.description,
            "demo_element":demo_div
        };
    }
    else{
        return null;
    }
}

export function getTooltip(key){
    const parameterDoc = getParameterDoc(key);
    if(parameterDoc){
        const tooltip_div = document.createElement("div");
        const text_div = document.createElement("p");
        text_div.appendChild(document.createTextNode(parameterDoc.description));
        tooltip_div.appendChild(text_div);
        parameterDoc.demo_element.classList.add("tooltip_demo");
        tooltip_div.appendChild(parameterDoc.demo_element);
        return document_createTooltip(tooltip_div);
    }
    else{
        return document.createTextNode("");
    }
    return document_createTooltip(tooltip_div);
}