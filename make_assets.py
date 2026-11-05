from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import re
root=Path(__file__).parent
src=root/'assets'/'monsters'; out=root/'assets'/'sprites'; out.mkdir(parents=True,exist_ok=True)
for f in src.glob('*.webp'):
    im=Image.open(f).convert('RGBA')
    w,h=im.size
    # Monster illustrations are centered in the source artwork; crop away the tile frame.
    side=min(h, int(h*1.02)); cx=w//2
    left=max(0,min(w-side,cx-side//2)); crop=im.crop((left,0,left+side,h)).resize((240,240),Image.Resampling.LANCZOS)
    # Feather the edge into transparency so the creature reads as a free-standing sprite.
    mask=Image.new('L',(240,240),0); d=ImageDraw.Draw(mask)
    d.ellipse((5,3,235,237),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(12))
    crop.putalpha(mask)
    crop.save(out/(f.stem+'.png'),optimize=True)

# Illustrated arena background, with no embedded monsters or UI.
svg='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice">
<defs>
 <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#64b9ed"/><stop offset=".55" stop-color="#d3e9df"/><stop offset="1" stop-color="#688c70"/></linearGradient>
 <linearGradient id="stone" x2="0" y2="1"><stop stop-color="#7e8994"/><stop offset=".45" stop-color="#4b5664"/><stop offset="1" stop-color="#202b3b"/></linearGradient>
 <linearGradient id="water" x2="0" y2="1"><stop stop-color="#c9f7ff"/><stop offset="1" stop-color="#179bd0"/></linearGradient>
 <linearGradient id="banner" x2="0" y2="1"><stop stop-color="#c62e37"/><stop offset="1" stop-color="#701b2b"/></linearGradient>
 <radialGradient id="glow"><stop stop-color="#fff7b0" stop-opacity=".9"/><stop offset="1" stop-color="#ff9b27" stop-opacity="0"/></radialGradient>
 <pattern id="tiles" width="120" height="72" patternUnits="userSpaceOnUse"><path d="M0 0H120M0 0L-25 72M60 0L35 72M120 0L95 72M0 36H120" fill="none" stroke="#b8c5d0" stroke-opacity=".25" stroke-width="2"/></pattern>
 <filter id="blur"><feGaussianBlur stdDeviation="8"/></filter>
</defs>
<rect width="900" height="650" fill="url(#sky)"/>
<!-- distant mountains and greenery -->
<path d="M0 260L90 145 165 215 250 112 340 230 455 110 570 225 680 125 790 220 900 135V390H0Z" fill="#527b86"/>
<path d="M0 280L120 180 210 250 320 155 425 260 555 155 665 260 785 175 900 255V400H0Z" fill="#315d62" opacity=".8"/>
<path d="M0 300Q120 235 240 300T480 292T720 285T900 300V420H0Z" fill="#3f794d"/>
<!-- waterfall -->
<path d="M580 175H690L670 365H600Z" fill="url(#water)" opacity=".92"/>
<path d="M600 185L610 350M625 180L632 350M650 185L650 355" stroke="#efffff" stroke-width="8" opacity=".45"/>
<!-- trees -->
<g fill="#24583d"><path d="M25 300l35-100 35 100zM5 330l55-120 55 120zM780 310l45-120 45 120zM820 330l55-135 45 135z"/></g>
<g fill="#4f9b55"><circle cx="65" cy="215" r="42"/><circle cx="105" cy="245" r="34"/><circle cx="820" cy="215" r="45"/><circle cx="865" cy="245" r="34"/></g>
<!-- rear stone wall -->
<path d="M0 300H900V440H0Z" fill="#465666" opacity=".9"/>
<path d="M0 320H900M0 370H900M0 420H900" stroke="#a8b2b8" stroke-opacity=".3" stroke-width="5"/>
<!-- pillars -->
<g fill="url(#stone)" stroke="#aeb7bd" stroke-width="5"><path d="M75 205H155V420H75Z"/><path d="M745 205H825V420H745Z"/><path d="M62 195H168V220H62Z"/><path d="M732 195H838V220H732Z"/></g>
<g fill="#d4a84c" stroke="#6b4b25" stroke-width="4"><path d="M175 195V330L225 355 275 330V195Z"/><path d="M625 195V330L675 355 725 330V195Z"/></g>
<g fill="url(#banner)" stroke="#f1c46b" stroke-width="5"><path d="M185 205H265V320L225 345 185 320Z"/><path d="M635 205H715V320L675 345 635 320Z"/></g>
<g fill="#ffcf4d"><path d="M225 235l-22 45h18l-8 35 30-52h-20l12-28zM675 235l-22 45h18l-8 35 30-52h-20l12-28z"/></g>
<!-- braziers -->
<g><ellipse cx="35" cy="420" rx="55" ry="55" fill="url(#glow)"/><ellipse cx="865" cy="420" rx="55" ry="55" fill="url(#glow)"/><path d="M10 405H60L55 445H15Z M840 405H890L885 445H845Z" fill="#293442" stroke="#d4a64c" stroke-width="5"/><path d="M35 400q-28-35 0-65 28 30 0 65M865 400q-28-35 0-65 28 30 0 65" fill="#ff9b26" stroke="#ffdf78" stroke-width="5"/></g>
<!-- arena floor -->
<path d="M0 425Q450 385 900 425V650H0Z" fill="url(#stone)"/>
<path d="M0 425Q450 385 900 425V650H0Z" fill="url(#tiles)"/>
<path d="M0 490Q450 455 900 490M0 565Q450 535 900 565" stroke="#d1d8dc" stroke-opacity=".2" stroke-width="4" fill="none"/>
<!-- battle rings -->
<ellipse cx="245" cy="540" rx="170" ry="42" fill="none" stroke="#72ff65" stroke-width="8" opacity=".8" filter="url(#blur)"/><ellipse cx="245" cy="540" rx="170" ry="42" fill="none" stroke="#9aff67" stroke-width="5"/>
<ellipse cx="665" cy="420" rx="150" ry="38" fill="none" stroke="#37dfff" stroke-width="8" opacity=".75" filter="url(#blur)"/><ellipse cx="665" cy="420" rx="150" ry="38" fill="none" stroke="#55eaff" stroke-width="5"/>
<rect width="900" height="650" fill="#061328" opacity=".08"/>
</svg>'''
(root/'assets'/'arena-background.svg').write_text(svg)
