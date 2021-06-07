var imagename;
var id=window.location.toString().split("/").pop();
$(()=>{
    $(".btn-primary").on('click',()=>{
        var name=$("#changed-name").val()
        
        $("#changed-name").val("")
        $("#myname").html(name)
        $.post("http://localhost:4500/change-name",{id:id,name:name})
    })
    $(".fa-arrow-left").on('click',()=>{
        window.history.back()
    })
    $(".no").on('click',()=>{
        $("#dialog").dialog('close');
    })
    $(".yes").on('click',()=>{
        $.post("http://localhost:4500/change-dp",{id:id,dp:imagename})
        $(".images[src='/images/"+imagename+"']").css("display","none")
        $(".container-fluid").append('<img class="images" src="/images/'+$(".dp").attr('title')+'" alt="Image" onclick="func(event)">')
        $(".dp").attr({"src":"/images/"+imagename,"title":imagename})
        $("#dialog").dialog('close');
    })
    $(".fa-trash").on('click',()=>{
        $("#deleteacc").dialog();
    })
    $(".del-no").on('click',()=>{
        $("#deleteacc").dialog('close');
    })
    $(".del-yes").on('click',()=>{
        $.post("http://localhost:4500/deleteacc",{id:id},(data)=>{
            window.location.assign("http://localhost:4500")
        })
    })
})

func=(event)=>{
    imagename=event.srcElement.attributes.src.nodeValue.toString().split("/").pop()
    $( "#dialog" ).dialog();
}
