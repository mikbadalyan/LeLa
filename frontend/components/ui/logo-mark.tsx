import Image from "next/image";

export function LogoMark() {
  return (
    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-borderSoft/10 bg-elevated shadow-soft">
      <Image src="/assets/logo.svg" alt="LE_LA" width={22} height={32} />
    </div>
  );
}
