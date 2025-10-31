document.addEventListener('DOMContentLoaded', function(){
  const paper = document.querySelector('.paper-inner');
  if(!paper) return;
  try {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  } catch(e){ }
  paper.addEventListener('wheel', function(e){
    const delta = e.deltaY;
    if ((delta > 0 && paper.scrollTop + paper.clientHeight < paper.scrollHeight) ||
        (delta < 0 && paper.scrollTop > 0)) {
    } else {
      e.preventDefault();
    }
  }, { passive:false });
  paper.setAttribute('tabindex', '0');
  paper.addEventListener('keydown', function(e){
    if(e.key === 'PageDown') { paper.scrollBy({ top: paper.clientHeight * 0.8, behavior:'smooth' }); e.preventDefault(); }
    if(e.key === 'PageUp') { paper.scrollBy({ top: -paper.clientHeight * 0.8, behavior:'smooth' }); e.preventDefault(); }
  });
});
