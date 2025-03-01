import Image from "next/image";
import LogoFull from "./LogoFull.svg";
import LogoIcon from "./LogoIcon.svg";

export default function Logo({ variant = "icon", ...props }) {
  if (variant === "full") {
    return <Image src={LogoFull} alt="Ingradient full logo" {...props} />;
  }
  return <Image src={LogoIcon} alt="Ingradient logo icon" {...props} />;
}
