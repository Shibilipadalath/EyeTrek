function flyTo(flyer, flyTo) {
    let flyerClone = flyer.cloneNode(true);
    flyerClone.style.position = 'absolute';
    flyerClone.style.width = `${flyer.offsetWidth}px`;
    flyerClone.style.height = `${flyer.offsetHeight}px`;
  
    
    const ft = flyTo.getBoundingClientRect(); 
    const f = flyer.getBoundingClientRect(); 
  
    
    const currentX = f.left + window.scrollX;
    const currentY = f.top + window.scrollY;
  
    
    flyerClone.style.left = `${currentX}px`;
    flyerClone.style.top = `${currentY}px`;
  
    flyerClone.style.opacity = 1;
    flyerClone.style.zIndex = 9999;
    document.body.appendChild(flyerClone);
  
    
    const targetX = ft.left + window.scrollX;
    const targetY = ft.top + window.scrollY;
  
    
    const targetWidth = ft.width;
    const targetHeight = ft.height;
    const currentWidth = f.width;
    const currentHeight = f.height;
  
    const targetOpacity = 0.3;
    const currentOpacity = 1;
  
    const animationDuration = 1000; 
  
    let startTime = null;
  
    function animateElement(timestamp) {
      if (!startTime) startTime = timestamp;
  
      const progress = timestamp - startTime;
      const ratio = Math.min(progress / animationDuration, 1);
  
      const newWidth = currentWidth - (currentWidth - targetWidth) * ratio;
      const newHeight = currentHeight - (currentHeight - targetHeight) * ratio;
  
      flyerClone.style.width = `${newWidth}px`;
      flyerClone.style.height = `${newHeight}px`;
  
      const deltaX = currentX - (currentX - targetX) * ratio;
      const deltaY = currentY - (currentY - targetY) * ratio;
  
      flyerClone.style.left = `${deltaX}px`;
      flyerClone.style.top = `${deltaY}px`;
  
      flyerClone.style.opacity = currentOpacity - (currentOpacity - targetOpacity) * ratio;
  
      if (ratio < 1) {
        requestAnimationFrame(animateElement);
      } else {
        setTimeout(function () {
          flyTo.style.visibility = 'hidden';
          setTimeout(function () {
            flyTo.style.visibility = 'visible';
            setTimeout(function () {
              flyerClone.style.display = 'visible';
              setTimeout(function () {
                flyerClone.remove();
              }, 200);
            }, 250);
          }, 250);
        }, 250);
      }
    }
  
    requestAnimationFrame(animateElement);
  }
  