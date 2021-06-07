socket = io();
add = window.location.toString().split("/");
fid = add.pop();
myid = add.pop();
ar = [myid, fid].sort();
roomname = ar[0] + ar[1];
socket.emit("new-user", $("#myimg").attr("title"));
if (fid !== "user") {
  socket.emit("room-created", roomname);
  socket.on("message", (msg) => {
    $("#chats").append(`<div class="fchat">${msg}</div>`);
  });
}

socket.on('user-connected',(id)=>{
  $("small[title='"+id+"']").html('online')
})
socket.on('user-disconnected',(id)=>{
  $("small[title='"+id+"']").html('offline')
})

socket.on("deleted",()=>{
  $("#chats").html("")
})

socket.on("name-changed",(id,name)=>{
  $("a[title='"+id+"']").html(name)
  $("#fname").html(name)
})

socket.on("dp-changed",(id,dp)=>{
  $("img[title='"+id+"']").attr("src","/images/"+dp)
})

socket.on("user-deleted",(id)=>{
  $("td[id='"+id+"']").css("display","none")
  if(fid==id){
    alert("user has deleted the account!!!")
    setTimeout(()=>{
      window.history.back()
    },3000)
  }
})


$(() => {
    if(screen.width<700 && fid!='user'){
      $(".side").css("display","none")
    }

  $(".fa-search").on('click',()=>{
    srch=$(".srch").val().toString().toLowerCase().split(" ").join("_");
    $(".srch").val("")
    $("td").css("display","none")
    $("td[title='"+srch+"']").css("display","block");
  })

  $(".btn-secondary").on('click',()=>{
    $("td").css("display","block")
  })
  
  $("#send").on("click", () => {
    msg = $("#new").val();
    if(msg!=""){
    postMessage(myid, fid, msg);
    socket.emit("send-message", msg, roomname);
    $("#chats").append(`<div class="mychat">${msg}</div>`);
    $("#new").val("");
    }
  });

  $(".fa-trash").on('click',()=>{
    ids=$(".fa-trash").attr('title').toString().split(" ")
    fid=ids[0]
    mid=ids[1]
    $.post("http://localhost:4500/delete",{fid:fid,myid:myid})
  })


  $(".fimage").on('click',()=>{
    $(".modal-image").attr('src',$(".fimage").attr('src'))
  })

  $(".fa-sign-out").on('click',()=>{
    window.location="http://localhost:4500"
  })

  $(".fa-arrow-left").on('click',()=>{
    window.history.back()
  })
});

postMessage = (myid, fid, msg) => {
  $.post("http://localhost:4500/post", { myid: myid, fid: fid, msg: msg });
};
