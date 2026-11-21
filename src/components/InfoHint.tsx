import {useCallback,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Info} from 'lucide-react';
import type {Category} from '../model';

/** Shared category tooltip, rendered outside cards/dialogs to avoid clipping and transforms. */
export default function InfoHint({item}:{item:Category}) {
  const id=useId();
  const anchor=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false);
  const [position,setPosition]=useState<{top:number;left:number;width:number}|null>(null);

  const place=useCallback(()=>{
    if(!anchor.current||!panel.current)return;
    const a=anchor.current.getBoundingClientRect();
    const margin=12;
    const gap=9;
    const viewportWidth=window.innerWidth;
    const viewportHeight=window.innerHeight;
    const width=Math.min(320,viewportWidth-margin*2);
    const height=panel.current.getBoundingClientRect().height;
    const left=Math.max(margin,Math.min(a.left+a.width/2-width/2,viewportWidth-margin-width));
    const topAbove=a.top-gap-height;
    const topBelow=a.bottom+gap;
    const top=topAbove>=margin?topAbove:topBelow+height<=viewportHeight-margin?topBelow:
      Math.max(margin,Math.min(topAbove,viewportHeight-margin-height));
    setPosition({top,left,width});
  },[]);

  useLayoutEffect(()=>{
    if(!open){setPosition(null);return;}
    place();
    const closeOnOutside=(event:PointerEvent)=>{
      if(!anchor.current?.contains(event.target as Node)&&!panel.current?.contains(event.target as Node))setOpen(false);
    };
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);anchor.current?.focus();}};
    const closeOnScroll=()=>setOpen(false);
    document.addEventListener('pointerdown',closeOnOutside);
    document.addEventListener('keydown',closeOnEscape);
    window.addEventListener('resize',place);
    window.addEventListener('scroll',closeOnScroll,true);
    return ()=>{
      document.removeEventListener('pointerdown',closeOnOutside);
      document.removeEventListener('keydown',closeOnEscape);
      window.removeEventListener('resize',place);
      window.removeEventListener('scroll',closeOnScroll,true);
    };
  },[open,place]);

  return <span className="info-hint">
    <button ref={anchor} type="button" className="info-hint-trigger"
      aria-label={'Informations sur '+item.label} aria-expanded={open}
      aria-describedby={open?id:undefined}
      onClick={event=>{event.preventDefault();event.stopPropagation();setOpen(value=>!value);}}
      onMouseEnter={()=>{if(window.matchMedia('(hover: hover)').matches)setOpen(true);}}
      onMouseLeave={()=>{if(window.matchMedia('(hover: hover)').matches)setOpen(false);}}
      onFocus={event=>{if(event.currentTarget.matches(':focus-visible'))setOpen(true);}}>
      <Info size={14} aria-hidden="true"/>
    </button>
    {open&&createPortal(<div ref={panel} id={id} role="tooltip" className="info-tooltip-portal"
      style={{top:position?.top??0,left:position?.left??12,width:position?.width??'min(320px, calc(100vw - 24px))',visibility:position?'visible':'hidden'}}>
      <span>{item.description}</span>
      <small>Référentiel : {item.canonical}</small>
    </div>,document.body)}
  </span>;
}
