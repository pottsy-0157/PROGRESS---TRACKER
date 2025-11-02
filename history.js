function parseWorkoutForDetail(html){ return html || ""; }
document.addEventListener("DOMContentLoaded",()=>{
  const tableBody = document.querySelector("#historyTable tbody");
  const detailCard = document.getElementById("detailCard");
  function render(){
    const history = JSON.parse(localStorage.getItem("workoutHistory")||"[]");
    tableBody.innerHTML = "";
    history.slice().reverse().forEach((h, idx)=>{
      const tr=document.createElement("tr");
      const date = new Date(h.completedAt||h.createdAt||Date.now()).toLocaleString();
      tr.innerHTML = `<td>${date}</td><td>${h.name}</td><td><span class="badge ${h.type}">${h.type.toUpperCase()}</span></td>
        <td>
          <button class="btn-inline small view" data-i="${idx}">View</button>
          <button class="btn-inline small reopen" data-i="${idx}">Reopen</button>
          <button class="btn-inline small del" data-i="${idx}">Delete</button>
        </td>`;
      tableBody.appendChild(tr);
    });
  }
  render();
  tableBody.addEventListener("click",(e)=>{
    if(e.target.classList.contains("view")){
      const i = parseInt(e.target.dataset.i);
      const history = JSON.parse(localStorage.getItem("workoutHistory")||"[]");
      const h = history.slice().reverse()[i];
      detailCard.style.display="block";
      detailCard.innerHTML = `<h3>${h.name}</h3><p><strong>Completed:</strong> ${new Date(h.completedAt||h.createdAt||Date.now()).toLocaleString()}</p><div>${parseWorkoutForDetail(h.details)}</div>`;
    }
    if(e.target.classList.contains("reopen")){
      const i = parseInt(e.target.dataset.i);
      const history = JSON.parse(localStorage.getItem("workoutHistory")||"[]");
      const h = history.slice().reverse()[i];
      sessionStorage.setItem("selectedWorkout", JSON.stringify(h));
      window.location.href="session.html";
    }
    if(e.target.classList.contains("del")){
      const i = parseInt(e.target.dataset.i);
      let history = JSON.parse(localStorage.getItem("workoutHistory")||"[]");
      const realIndex = history.length - 1 - i;
      history.splice(realIndex,1);
      localStorage.setItem("workoutHistory", JSON.stringify(history));
      render();
      detailCard.style.display="none";
    }
  });
});