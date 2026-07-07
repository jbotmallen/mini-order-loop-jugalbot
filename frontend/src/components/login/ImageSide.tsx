import { cn } from "@/lib/utils";
import Logo from "../ui/Logo"

interface ImageSideProps {
  imgSrc?: string;
  className?: string;
}

export const ImageSide = ({ imgSrc = '/login-bg.png', className }: ImageSideProps) => {
  return (
    <div className={cn("relative hidden lg:block min-h-dvh h-full w-full bg-tertiary-surface-container", className)}>
      <div className="absolute inset-0">
        <img
          src={imgSrc}
          alt="Login"
          className="object-cover h-full w-full"
        />
      </div>
      <div className="absolute inset-0 bg-surface-dim opacity-70"></div>
      <div className="absolute inset-x-10 bottom-5 space-y-4">
        <Logo />
      </div>
    </div>
  )
}