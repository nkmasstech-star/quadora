package com.quadora.app;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Reads the Google Play install referrer once: the "referrer" part of the Play link the player installed from
// (our invite links put the inviter's id, and a group id, there). Empty when installed some other way.
@CapacitorPlugin(name = "Referrer")
public class ReferrerPlugin extends Plugin {
    @PluginMethod
    public void get(final PluginCall call) {
        final InstallReferrerClient client = InstallReferrerClient.newBuilder(getContext()).build();
        try {
            client.startConnection(new InstallReferrerStateListener() {
                private boolean done = false;
                @Override
                public void onInstallReferrerSetupFinished(int code) {
                    if (done) return; done = true;
                    JSObject r = new JSObject();
                    try {
                        if (code == InstallReferrerClient.InstallReferrerResponse.OK) {
                            ReferrerDetails d = client.getInstallReferrer();
                            r.put("referrer", d.getInstallReferrer());
                            r.put("installAt", d.getInstallBeginTimestampSeconds());
                        } else r.put("referrer", "");
                    } catch (Exception e) { r.put("referrer", ""); }
                    try { client.endConnection(); } catch (Exception e) { /* ignore */ }
                    call.resolve(r);
                }
                @Override
                public void onInstallReferrerServiceDisconnected() {
                    if (done) return; done = true;
                    JSObject r = new JSObject(); r.put("referrer", ""); call.resolve(r);
                }
            });
        } catch (Exception e) {
            JSObject r = new JSObject(); r.put("referrer", ""); call.resolve(r);
        }
    }
}
