import { useEffect, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mainlandCity, mainlandAerial, mainlandPhotos } from '@/lib/mainland-media';
import { siteMediaQuery } from '@/lib/queries';
import { HOME_GALLERY_FALLBACK, resolveSiteMediaUrl, type GalleryItem } from '@/lib/site-media';

const SLIDES = [
  { src: mainlandCity, alt: 'Aerial view across Mainland Lagos', label: 'Lagos. A place to belong.' },
  { src: mainlandPhotos[0] ?? mainlandAerial, alt: 'Clear aerial view of Mainland Lagos roads and neighbourhoods', label: 'Connected to the Mainland.' },
  { src: mainlandPhotos[3] ?? mainlandAerial, alt: 'Bright modern apartment building in Maryland, Lagos', label: 'Room to grow in Maryland.' },
];

const TAGLINES = [
  'Your Trusted Real Estate Partner on the Mainland',
  'Find your next home in Mainland Lagos',
  'Real places. A personal approach.',
];

const GRID_LABELS = [
  'Completed property from JustMainlandNG',
  'Property development from JustMainlandNG',
  'Maryland apartment promotion',
  'JustMainlandNG property investment promotion',
  'A home and future on the Mainland',
];

/** Cycles the hero tagline upward on a loop; static for reduced-motion visitors. */
function RotatingTagline() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % TAGLINES.length), 4200);
    return () => clearInterval(timer);
  }, []);
  return (
    <p className="mt-5 max-w-xl text-lg font-medium">
      <span className="relative block h-[1.6em] overflow-hidden">
        <span key={index} className="animate-tagline block">
          {TAGLINES[index]}
        </span>
      </span>
    </p>
  );
}

export function HomeSlider(){
 const { data: media } = useSuspenseQuery(siteMediaQuery);
 const heroVideo = media.heroVideoUrl ? resolveSiteMediaUrl(media.heroVideoUrl) : '';
 const [showVideo, setShowVideo] = useState(false);
 useEffect(() => {
   setShowVideo(Boolean(heroVideo) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 }, [heroVideo]);
 const [index,setIndex]=useState(0);const [paused,setPaused]=useState(false);
 useEffect(()=>{if(paused||showVideo||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=setInterval(()=>setIndex(i=>(i+1)%SLIDES.length),6500);return()=>clearInterval(timer);},[paused,showVideo]);

 const localGallery: GalleryItem[] = mainlandPhotos.map((image_url, index) => ({
   id: `mainland-local-${index + 1}`,
   title: GRID_LABELS[index] ?? 'Mainland Lagos property',
   image_url,
 }));
 const gallery: GalleryItem[] = media.home.length > 0
   ? [...localGallery, ...media.home]
   : [...localGallery, ...HOME_GALLERY_FALLBACK];

 return <><section className="home-slider relative isolate overflow-hidden" aria-roledescription="carousel" aria-label="Mainland Lagos photographs" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
 {showVideo && heroVideo ? (
   <video key={heroVideo} src={heroVideo} poster={mainlandCity} autoPlay muted loop playsInline aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover" />
 ) : (
   SLIDES.map((slide,i)=><img key={slide.src} src={slide.src} alt={slide.alt} fetchPriority={i===0?'high':'auto'} aria-hidden={i!==index} className={`absolute inset-0 -z-20 size-full object-cover transition-opacity duration-1000 ${i===index?'opacity-100':'opacity-0'}`}/>)
 )}
 <div className="absolute inset-0 -z-10 bg-foreground/40"/>
 <div className="mx-auto flex min-h-[530px] max-w-7xl flex-col justify-center px-5 pb-28 pt-16 text-primary-foreground sm:px-8 lg:min-h-[620px]">
 <p className="text-xs font-semibold uppercase">Welcome to JustMainlandNG</p><h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl lg:text-6xl">JustMainlandNG</h1>
 <RotatingTagline />
 <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/90">Find your next home, rental or investment in Mainland Lagos. Real places. A personal approach.</p>
 <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/properties">Explore properties <ArrowRight className="size-4"/></Link></Button><Button asChild size="lg" variant="secondary"><Link to="/contact">Book an inspection</Link></Button></div>
 {!showVideo && (
 <div className="absolute inset-x-0 bottom-0"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8"><p className="text-sm font-medium">{SLIDES[index]?.label}</p><div className="flex gap-2"><Button variant="secondary" size="icon" aria-label="Previous slide" onClick={()=>setIndex(i=>(i+SLIDES.length-1)%SLIDES.length)}><ChevronLeft className="size-4"/></Button><Button variant="secondary" size="icon" aria-label={paused?'Play slideshow':'Pause slideshow'} onClick={()=>setPaused(p=>!p)}>{paused?<Play className="size-4"/>:<Pause className="size-4"/>}</Button><Button variant="secondary" size="icon" aria-label="Next slide" onClick={()=>setIndex(i=>(i+1)%SLIDES.length)}><ChevronRight className="size-4"/></Button></div></div></div>
 )}
 </div></section><section className="mx-auto max-w-7xl px-5 py-10 sm:px-8"><div className="flex items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase text-primary">From the Mainland</p><h2 className="mt-2 text-2xl font-semibold">Places. Progress. Possibility.</h2></div></div><div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{gallery.map((item,i)=><a key={item.id} href={resolveSiteMediaUrl(item.image_url)} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-lg border border-border bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-lg" aria-label={`View Mainland brand photograph ${i+1}`}><img src={resolveSiteMediaUrl(item.image_url)} alt={item.title || GRID_LABELS[i % GRID_LABELS.length]} width={400} height={500} loading="lazy" className="aspect-4/5 size-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"/></a>)}</div></section></>;
}
