import Logo from "../ui/Logo"

export const ImageSide = () => {
  return (
    <div className="relative hidden lg:block min-h-dvh h-full w-full bg-tertiary-surface-container">
      <div className="absolute inset-0">
        <img
          src="/login-bg.png"
          alt="Login"
          className="object-cover h-full w-full"
        />
      </div>
      <div className="absolute inset-0 bg-black opacity-70"></div>
      <div className="absolute inset-x-10 bottom-5 space-y-4">
        <Logo />
      </div>
    </div>
  )
}