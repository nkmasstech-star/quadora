package com.quadora.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAdsPlugin.class);
        registerPlugin(ReferrerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
