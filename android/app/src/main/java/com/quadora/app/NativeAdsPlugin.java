package com.quadora.app;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdOptions;
import com.google.android.gms.ads.nativead.NativeAdView;

import java.util.HashMap;
import java.util.Map;

/**
 * In-feed native ads drawn by Google's NativeAdView on top of the WebView, lined up with an HTML placeholder.
 * JS keeps sending the placeholder position (CSS px) and the visible band (clipTop..clipBottom) so the ad moves with the page.
 */
@CapacitorPlugin(name = "NativeAds")
public class NativeAdsPlugin extends Plugin {

    private static class Slot {
        NativeAd ad;
        NativeAdView view;
        boolean destroyed;
    }

    private FrameLayout layer;
    private final Map<Integer, Slot> slots = new HashMap<>();
    private int nextId = 1;

    private float dp(float v) {
        return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getContext().getResources().getDisplayMetrics());
    }

    private void ensureLayer() {
        if (layer != null) return;
        WebView wv = getBridge().getWebView();
        ViewGroup parent = (ViewGroup) wv.getParent();
        layer = new FrameLayout(getContext());
        layer.setClipChildren(true);
        layer.setClipToPadding(true);
        parent.addView(layer, new ViewGroup.LayoutParams(0, 0));
        layer.setVisibility(View.GONE);
    }

    private int color(String s, int def) {
        try { return Color.parseColor(s); } catch (Exception e) { return def; }
    }

    @PluginMethod
    public void create(PluginCall call) {
        final String unit = call.getString("adUnitId");
        final JSObject theme = call.getObject("theme", new JSObject());
        if (unit == null) { call.reject("adUnitId missing"); return; }
        final int id = nextId++;
        final Slot slot = new Slot();
        slots.put(id, slot);
        getActivity().runOnUiThread(() -> {
            ensureLayer();
            AdLoader loader = new AdLoader.Builder(getContext(), unit)
                .forNativeAd(ad -> {
                    if (slot.destroyed) { ad.destroy(); return; }
                    slot.ad = ad;
                    slot.view = buildView(ad, theme);
                    slot.view.setVisibility(View.GONE);
                    layer.addView(slot.view, new FrameLayout.LayoutParams(0, 0));
                    send(id, "loaded");
                })
                .withAdListener(new AdListener() {
                    @Override public void onAdFailedToLoad(LoadAdError e) { send(id, "failed"); }
                    @Override public void onAdClicked() { send(id, "clicked"); }
                })
                .withNativeAdOptions(new NativeAdOptions.Builder()
                    .setAdChoicesPlacement(NativeAdOptions.ADCHOICES_TOP_RIGHT)
                    .setMediaAspectRatio(NativeAdOptions.NATIVE_MEDIA_ASPECT_RATIO_LANDSCAPE)
                    .build())
                .build();
            loader.loadAd(new AdRequest.Builder().build());
        });
        JSObject r = new JSObject();
        r.put("id", id);
        call.resolve(r);
    }

    private void send(int id, String state) {
        JSObject o = new JSObject();
        o.put("id", id);
        o.put("state", state);
        notifyListeners("nativeAd", o);
    }

    private NativeAdView buildView(NativeAd ad, JSObject th) {
        int bg = color(th.getString("bg"), Color.WHITE);
        int text = color(th.getString("text"), Color.BLACK);
        int muted = color(th.getString("muted"), Color.GRAY);
        int gold = color(th.getString("gold"), Color.parseColor("#E8B94A"));
        int onGold = color(th.getString("onGold"), Color.BLACK);
        int border = color(th.getString("border"), Color.LTGRAY);

        NativeAdView root = new NativeAdView(getContext());
        LinearLayout card = new LinearLayout(getContext());
        card.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) dp(14);
        card.setPadding(pad, pad, pad, pad);
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(bg);
        shape.setCornerRadius(dp(22));
        shape.setStroke((int) dp(1), border);
        card.setBackground(shape);
        card.setClipToOutline(true);

        // header: icon + headline + "Ad" badge / advertiser
        LinearLayout head = new LinearLayout(getContext());
        head.setOrientation(LinearLayout.HORIZONTAL);
        head.setGravity(Gravity.CENTER_VERTICAL);
        ImageView icon = new ImageView(getContext());
        int is = (int) dp(42);
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(is, is);
        ilp.rightMargin = (int) dp(10);
        icon.setScaleType(ImageView.ScaleType.CENTER_CROP);
        GradientDrawable iconBg = new GradientDrawable();
        iconBg.setCornerRadius(dp(21));
        iconBg.setColor(border);
        icon.setBackground(iconBg);
        icon.setClipToOutline(true);
        if (ad.getIcon() != null) icon.setImageDrawable(ad.getIcon().getDrawable());
        head.addView(icon, ilp);

        LinearLayout names = new LinearLayout(getContext());
        names.setOrientation(LinearLayout.VERTICAL);
        TextView headline = new TextView(getContext());
        headline.setText(ad.getHeadline());
        headline.setTextColor(text);
        headline.setTypeface(Typeface.DEFAULT_BOLD);
        headline.setTextSize(15);
        headline.setMaxLines(1);
        headline.setEllipsize(TextUtils.TruncateAt.END);
        names.addView(headline);
        LinearLayout sub = new LinearLayout(getContext());
        sub.setOrientation(LinearLayout.HORIZONTAL);
        sub.setGravity(Gravity.CENTER_VERTICAL);
        TextView badge = new TextView(getContext());
        badge.setText("Ad");
        badge.setTextSize(10.5f);
        badge.setTypeface(Typeface.DEFAULT_BOLD);
        badge.setTextColor(onGold);
        GradientDrawable bb = new GradientDrawable();
        bb.setColor(gold);
        bb.setCornerRadius(dp(5));
        badge.setBackground(bb);
        badge.setPadding((int) dp(5), (int) dp(1), (int) dp(5), (int) dp(1));
        sub.addView(badge);
        TextView adv = new TextView(getContext());
        String by = ad.getAdvertiser() != null ? ad.getAdvertiser() : (ad.getStore() != null ? ad.getStore() : "Sponsored");
        adv.setText(by);
        adv.setTextColor(muted);
        adv.setTextSize(12);
        adv.setMaxLines(1);
        adv.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams alp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        alp.leftMargin = (int) dp(6);
        sub.addView(adv, alp);
        names.addView(sub);
        head.addView(names, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        card.addView(head, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int) dp(44)));

        TextView body = new TextView(getContext());
        body.setText(ad.getBody() != null ? ad.getBody() : "");
        body.setTextColor(muted);
        body.setTextSize(13);
        body.setMaxLines(2);
        body.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int) dp(36));
        blp.topMargin = (int) dp(10);
        card.addView(body, blp);

        MediaView media = new MediaView(getContext());
        media.setImageScaleType(ImageView.ScaleType.CENTER_CROP);
        GradientDrawable mbg = new GradientDrawable();
        mbg.setCornerRadius(dp(14));
        mbg.setColor(border);
        media.setBackground(mbg);
        media.setClipToOutline(true);
        LinearLayout.LayoutParams mlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f);
        mlp.topMargin = (int) dp(8);
        card.addView(media, mlp);

        Button cta = new Button(getContext());
        cta.setAllCaps(false);
        cta.setText(ad.getCallToAction() != null ? ad.getCallToAction() : "Open");
        cta.setTextColor(onGold);
        cta.setTypeface(Typeface.DEFAULT_BOLD);
        cta.setTextSize(14);
        cta.setStateListAnimator(null);
        GradientDrawable cbg = new GradientDrawable();
        cbg.setColor(gold);
        cbg.setCornerRadius(dp(999));
        cta.setBackground(cbg);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int) dp(42));
        clp.topMargin = (int) dp(10);
        card.addView(cta, clp);

        root.addView(card, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.setHeadlineView(headline);
        root.setBodyView(body);
        root.setIconView(icon);
        root.setAdvertiserView(adv);
        root.setMediaView(media);
        root.setCallToActionView(cta);
        root.setNativeAd(ad);
        return root;
    }

    /** x, y, width, height of the placeholder and the visible band, all in CSS px from the WebView top-left. */
    @PluginMethod
    public void setBounds(PluginCall call) {
        final int id = call.getInt("id", 0);
        final float x = call.getFloat("x", 0f), y = call.getFloat("y", 0f), w = call.getFloat("width", 0f), h = call.getFloat("height", 0f);
        final float top = call.getFloat("clipTop", 0f), bottom = call.getFloat("clipBottom", 0f);
        final boolean visible = Boolean.TRUE.equals(call.getBoolean("visible", true));
        getActivity().runOnUiThread(() -> {
            Slot s = slots.get(id);
            if (s == null || s.view == null || layer == null) return;
            WebView wv = getBridge().getWebView();
            float d = getContext().getResources().getDisplayMetrics().density;
            int lTop = Math.round(wv.getTop() + top * d);
            int lH = Math.max(0, Math.round((bottom - top) * d));
            ViewGroup.LayoutParams llp = layer.getLayoutParams();
            if (llp.width != wv.getWidth() || llp.height != lH) { llp.width = wv.getWidth(); llp.height = lH; layer.setLayoutParams(llp); }
            layer.setX(wv.getLeft());
            layer.setY(lTop);
            boolean show = visible && lH > 0 && (y + h) > top && y < bottom;
            layer.setVisibility(View.VISIBLE);
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) s.view.getLayoutParams();
            int pw = Math.round(w * d), ph = Math.round(h * d);
            if (lp.width != pw || lp.height != ph) { lp.width = pw; lp.height = ph; s.view.setLayoutParams(lp); }
            s.view.setX(x * d);
            s.view.setY((y - top) * d);
            s.view.setVisibility(show ? View.VISIBLE : View.GONE);
        });
        call.resolve();
    }

    @PluginMethod
    public void destroy(PluginCall call) {
        final int id = call.getInt("id", 0);
        getActivity().runOnUiThread(() -> {
            Slot s = slots.remove(id);
            if (s == null) return;
            s.destroyed = true;
            if (s.view != null && layer != null) layer.removeView(s.view);
            if (s.ad != null) s.ad.destroy();
        });
        call.resolve();
    }
}
