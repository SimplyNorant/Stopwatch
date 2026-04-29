import { useState } from "react";
import * as motion from "motion/react-client";

export default function EnterAnimation() {
  const [clicked, setClicked] = useState(false);

  return (
    <button onClick={() => setClicked(!clicked)}>
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={clicked ? { opacity: 0, scale: 0 } : "hidden"}
        transition={{
          duration: 0.4,
          scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
        }}
        style={ball}
      />
    </button>
  );
}

/**
 * ==============   Styles   ================
 */

const ball = {
  width: 100,
  height: 100,
  backgroundColor: "#dd00ee",
  borderRadius: "50%",
};
