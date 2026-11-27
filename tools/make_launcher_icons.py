from PIL import Image
import os
R='android/app/src/main/res'
badge=Image.open('brand/nehroopa-badge-1024.png').convert('RGBA')
LEG=0.74   # badge size on legacy square/round icons (was ~0.84)
FG=0.54    # badge size on adaptive foreground (was ~0.64; launcher shows the middle 2/3, so ~81% of the visible circle)
for d in ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']:
    for name,scale in [('ic_launcher',LEG),('ic_launcher_round',LEG),('ic_launcher_foreground',FG)]:
        p=f'{R}/mipmap-{d}/{name}.png'
        old=Image.open(p).convert('RGBA'); W,H=old.size
        if name=='ic_launcher_foreground':
            base=Image.new('RGBA',(W,H),(0,0,0,0))
        else:
            base=Image.new('RGBA',(W,H),(255,255,255,255)); base.putalpha(old.split()[-1])
        s=round(W*scale); b=badge.resize((s,s),Image.LANCZOS)
        base.alpha_composite(b,((W-s)//2,(H-s)//2))
        base.save(p)
print('ok')
