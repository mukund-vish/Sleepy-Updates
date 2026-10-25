"use client";
import Script from "next/script";

// Buy Me a Coffee floating button.
// The widget initialises on DOMContentLoaded, which has already fired by the time
// Next loads the script, so we fire it once manually after the script loads.
export default function BmcWidget() {
  return (
    <Script
      id="bmc-widget"
      src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
      strategy="afterInteractive"
      data-name="BMC-Widget"
      data-cfasync="false"
      data-id="mukundvish"
      data-description="Support me on Buy me a coffee!"
      data-message=""
      data-color="#40DCA5"
      data-position="Right"
      data-x_margin="18"
      data-y_margin="18"
      onLoad={() => {
        window.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
      }}
    />
  );
}