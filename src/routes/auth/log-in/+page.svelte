<script lang="ts">
    import { postWithBody } from '$lib/api/apiGateway';
    import { goto } from '$app/navigation';
    import { session } from '$lib/stores/session';
    import '$lib/firebase';
    import {
        signInWithEmailAndPassword,
        getAuth,
        browserSessionPersistence,
        signInWithPopup,
        GoogleAuthProvider,
        FacebookAuthProvider,
    } from 'firebase/auth';
    import { onMount } from 'svelte';
    let model = {
        email: '',
        password: '',
    };
    let errors: Record<string, string> = {};
    onMount(() => {
        if ($session) {
            goto('/messages')
        }
    })
    async function onSignIn() {
        const auth = getAuth();
        errors = {};
        try {
            await auth.setPersistence(browserSessionPersistence);
            const cred = await signInWithEmailAndPassword(
                auth,
                model.email,
                model.password,
            );
            if (cred && cred.user) {
                const res = await postWithBody('api/auth/get-auth', {email: model.email});
                if (res.ok) {
                    const authRes = await res.json();
                    session.update((u) => u = authRes);
                    goto('/messages')
                } else {
                    session.set(undefined);
                }
            }
        } catch (err) {
            if (err.code === 'auth/wrong-password') {
                errors.password = 'Password is incorrect';
            } else if (err.code === 'auth/user-not-found') {
                errors.email = 'This email is unregistered';
            } else {
                console.error('Error login', err);
                if (typeof err == 'object') {
                    if (err.inner) {
                        errors = err.inner.reduce((acc, err) => {
                        return { ...acc, [err.path]: err.message };
                        }, {});
                    }
                }
            }
        }
    }
</script>
<!-- <div class="container bg-zinc-800 min-w-full h-screen flex justify-center">
    <form class="form card w-fit h-fit mt-16 flex-col justify-center items-center p-8" on:submit={onSignIn}>
        <h1 class="text-center">Đăng nhập</h1>
        <div class="my-4">
            <label class="label">
                <span>Email</span>
                <input class="input" type="text" placeholder="Nhập email" bind:value={model.email}/>
            </label>
            <label class="label my-4">
                <span>Mật khẩu</span>
                <input class="input" type="password" placeholder="Nhập mật khẩu" bind:value={model.password}/>
            </label>
        </div>
        <div class="flex justify-center mb-4">
            <button type="button" class="btn variant-filled" on:click={onSignIn}>Đăng nhập</button>
        </div>
        <h2 class="text-center">Chưa có tài khoản? <a href="/auth/register" class="underline">Đăng ký</a></h2>
    </form>
</div> -->
<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <img class="mx-auto h-10 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Sign in to your account</h2>
    </div>
  
    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" action="#" method="POST">
        <div>
          <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email address</label>
          <div class="mt-2">
            <input id="email" name="email" type="email" autocomplete="email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
          </div>
        </div>
  
        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
            <div class="text-sm">
              <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
            </div>
          </div>
          <div class="mt-2">
            <input id="password" name="password" type="password" autocomplete="current-password" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
          </div>
        </div>
  
        <div>
          <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</button>
        </div>
      </form>
  
      <p class="mt-10 text-center text-sm text-gray-500">
        Not a member?
        <a href="#" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">Start a 14 day free trial</a>
      </p>
    </div>
  </div>