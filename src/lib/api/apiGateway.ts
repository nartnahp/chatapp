import { apiUrl } from "$lib/env"
// Post with body
export function postWithBody (
    patchTarget: string,
    body?: any
): Promise<Response> {
    return fetch(`${apiUrl}/${patchTarget}`, {
        method: 'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body: body ? JSON.stringify(body) : ''
    }
)}

// Get
export function getFullField (
    patchTarget: string,
): Promise<Response> {
    return fetch(`${apiUrl}/${patchTarget}`, {
        method: 'get',
        headers:{
            'Content-Type':'application/json'
        },
    }
)}

// Post with file
export function postWithFile (
    patchTarget: string,
    body?: any
): Promise<Response> {
    return fetch(`${apiUrl}/${patchTarget}`, {
        method: 'POST',
        body: body
    }
)}