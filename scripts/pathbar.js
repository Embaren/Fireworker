const path_div = document.getElementById("path_div");
const full_path = window.location.pathname;
const path_elements = full_path.split('/');
path_elements.pop();
function get_page_info(path){
    return fetch(path+'/page_info.json')
        .then((response) => response.json());
}
for(let i = 0 ; i < path_elements.length ; i++){
    const a = document.createElement("a");
    path_div.appendChild(a);
    const element_path = path_elements.slice(0,i+1).join('/');
    get_page_info(element_path)
        .then((page_info)=>{
            a.href = element_path+'/';
            a.style.zIndex = path_elements.length-i;
            const page_name = document.createTextNode(page_info.name);
            a.appendChild(page_name);
            a.classList.add(page_info.theme);
            if(i===(path_elements.length-1)){
                document.title = document.title+" - "+page_info.name;
            }
        });
}