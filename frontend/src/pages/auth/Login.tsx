import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'

export function Login() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Welcome back! Please enter your details.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground block">
              Email
            </label>
            <Input id="email" type="email" placeholder="m@example.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground block">
              Password
            </label>
            <Input id="password" type="password" />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full">Sign in</Button>
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
