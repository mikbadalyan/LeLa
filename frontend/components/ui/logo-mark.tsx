import Image from "next/image";

export function LogoMark() {
  return (
    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-plum bg-white shadow-sm">
      <Image src="/assets/logo.svg" alt="LE_LA" width={22} height={32} />
    </div>
  );
}
