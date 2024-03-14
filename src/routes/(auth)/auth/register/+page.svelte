<script lang="ts">
    import { postWithBody } from '$lib/api/apiGateway';
    import { goto } from '$app/navigation';
    import { session } from '$lib/stores/session';
    import '$lib/firebase';
    import {
        createUserWithEmailAndPassword,
        getAuth,
        inMemoryPersistence,
        signInWithPopup,
        GoogleAuthProvider,
        FacebookAuthProvider,
        AuthErrorCodes,
        sendEmailVerification,
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
    async function onSignUp() {
        errors = {};
        const auth = getAuth();
        try {
            const cred = await createUserWithEmailAndPassword(
                auth,
                model.email,
                model.password,
            );
            if (cred && cred.user) {
                const res = await postWithBody('api/auth/register', {email: cred.user.email});
                if (res.ok) {
                    const user = await res.json();
                    session.update((u) => u = user);
                    goto('/', {invalidateAll: true});
                } else {
                    console.log('Error authenticating', res);
                }
            }
        } catch (err) {
            console.log('err', err);
            if (err.code === AuthErrorCodes.EMAIL_EXISTS) {
                errors.email = 'You have already signed up. Please sign in instead.';
                console.log(errors.email);
            } else {
                console.error('Error registering', err);
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

<div class="container min-w-full h-screen flex justify-center">
    <form on:submit={onSignUp} action="javascript:void(0);">
        <div class="card bg-primary w-fit h-fit mt-16 flex-col justify-center items-center p-8">
            <h1 class="text-center text-2xl font-bold text-primary-content">Đăng ký</h1>
            <div class="my-4">
                <label class="label">
                    <span class="text-primary-content">Email</span>
                    <input class="input input-primary" type="email" placeholder="Nhập email" bind:value={model.email}/>
                </label>
                <label class="label my-4">
                    <span class="text-primary-content">Mật khẩu</span>
                    <input class="input input-primary" type="password" placeholder="Nhập mật khẩu" bind:value={model.password}/>
                </label>
            </div>
            <div class="flex justify-center mb-4">
                <button type="submit" class="btn variant-filled">Đăng ký</button>
            </div>
            <h2 class="text-center text-primary-content">Đã có tài khoản? <a href="/auth/log-in" class="underline">Đăng nhập</a></h2>
        </div>
    </form>
</div>