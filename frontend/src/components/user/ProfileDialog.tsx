import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Loader2Icon, UserCog2Icon, UserIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Navigate, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { Button } from "../ui/button";

export const ProfileDialog = () => {
  const { user, isAuthenticated, logout: clearSession } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = useMutation({
    mutationFn: () => api('/logout', { method: 'POST' }),
    onSettled: () => {
      clearSession()
      queryClient.clear()
      navigate('/login')
    },
  })

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Dialog>
      <DialogTrigger className="flex items-center gap-3 rounded px-4 py-3 text-label-md text-on-surface-variant hover:bg-surface-container">
        <UserCog2Icon className="size-5" />
        <span className='text-left flex flex-col'>
          <p className='font-bold'>{user.name}</p>
          <p className='text-label-sm text-on-surface-variant/60'>
            {user.email}
          </p>
        </span>
      </DialogTrigger>
      <DialogContent className="p-6">
        <div className="flex items-center justify-center flex-col gap-4 mt-6">
          <UserIcon className="size-16 md:size-20 lg:size-24 p-4 rounded-full border-2 border-white" />
          <div className="space-y-1 grid place-content-center text-center">
            <h1 className="font-semibold">Welcome back</h1>
            <h1 className="text-xl font-semibold">{user.name}</h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-sm uppercase tracking-wide text-on-primary-fixed-variant">
                {user.role}
              </span>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="mt-8 flex items-center gap-2 w-full h-12"
            color="error"
            variant="destructive"
            size="lg"
          >
            {logout.isPending ? (
              <>
                <Loader2Icon className="size-5 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <FiLogOut className="size-5" />
                Logout
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}