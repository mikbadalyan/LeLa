import Image from "next/image";

export function LogoMark() {
  return (
    <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-borderSoft/10 bg-elevated shadow-soft">
      <Image src="/assets/logo.svg" alt="LE_LA" width={18} height={26} />
    </div>
  );
}
