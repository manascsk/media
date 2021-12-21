var floatingWindow = {
    dragstart_handler: function(event) {
    var originalEvent = event.originalEvent,
        dataTransfer = event.originalEvent.dataTransfer;
        dataTransfer.setData("id", this.id);
        dataTransfer.setData("offsetX", this.offsetLeft - originalEvent.pageX);
        dataTransfer.setData("offsetY", this.offsetTop - originalEvent.pageY);
    },
    dragover_handler: function(event) {
      event.preventDefault();
    },
    drop_handler: function(event) {
      event.preventDefault();
      var originalEvent = event.originalEvent,
          dataTransfer = event.originalEvent.dataTransfer,
          $container = $(this),
          topMax = $container.height(),
          leftMax = $container.width(),
          topRequested = originalEvent.pageY + parseInt(dataTransfer.getData("offsetY")),
          leftRequested = originalEvent.pageX + parseInt(dataTransfer.getData("offsetX")),
          $element = $("#" + dataTransfer.getData("id")),
          elementHeight = $element.outerHeight(),
          elementWidth = $element.outerWidth()
      ;
      
      // Adapt the requested position so the element fit the container.
      if (topRequested < 0) topRequested = 0;
      if (elementHeight + topRequested > topMax) topRequested = topMax - elementHeight;
      if (leftRequested < 0) leftRequested = 0;
      if (elementWidth + leftRequested > leftMax) leftRequested = leftMax - elementWidth;
      
      $element
        .css({
          top: topRequested,
          left: leftRequested
        });
    }
}

$(document).ready(function(){
  $("[draggable='true']").on("dragstart", floatingWindow.dragstart_handler);
    $(".container").on("dragover", floatingWindow.dragover_handler);
    $(".container").on("drop", floatingWindow.drop_handler);
});

function chatopenNav() {
        document.getElementById("myChatpanel").style.width = "350px";
      }
      
      function chatcloseNav() {
        document.getElementById("myChatpanel").style.width = "0";
      }

 function participantsopenNav() {
        document.getElementById("Participantspanel").style.width = "200px";
      }
      
      function participantscloseNav() {
        document.getElementById("Participantspanel").style.width = "0";
      }