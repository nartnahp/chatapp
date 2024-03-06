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
<div class="container bg-zinc-800 min-w-full h-screen flex justify-center">
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
</div>