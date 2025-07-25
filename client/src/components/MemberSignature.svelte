<svelte:window bind:innerWidth/>
<script>
    import SignaturePad from "signature_pad"
    import {createEventDispatcher, onMount} from "svelte";
    import {screenWidthM} from "../stores/navigation";

    export let edit
    export let renew

    let innerWidth = 0
    let signaturePad
    let dispatched = false
    let validated = false

    const dispatch = createEventDispatcher()

    $: innerWidth && clear()

    onMount(() => {
        if (!edit) {
            signaturePad = new SignaturePad(document.querySelector("canvas"))
            signaturePad.addEventListener("endStroke", () => {
                validated = true
            }, {once: false})
        } else
            dispatchSignature()
    })

    function clear() {
        signaturePad?.clear()
        validated = false
    }

    function back() {
        dispatch('message', {
            goto: 'form'
        })
    }

    function dispatchSignature() {
        dispatched = true
        if (signaturePad !== undefined && !signaturePad.isEmpty())
            dispatch('message', {
                signature: signaturePad.toDataURL()
            })
        else
            dispatch('message', {})
    }
</script>

<h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom">
    {#if !dispatched}
        Please sign
    {:else if edit || renew}
        Updating member
    {:else}
        Creating member
    {/if}
</h4>
{#if dispatched}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <div class="uk-card uk-card-default">
        <div class="uk-flex uk-flex-center">
            <canvas id="signature-pad" width="{$screenWidthM ? 500 : 700}" height="{$screenWidthM ? 300 : 450}"></canvas>
        </div>
        <div class="uk-flex uk-flex-center">
            <a class="uk-link-text uk-text-meta uk-margin" href="{'#'}" on:click={clear}>Erase canvas</a>
        </div>
    </div>
    <div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
        <button class="uk-button uk-button-default"
                type="button" on:click={back}>Back</button>
        <button class="uk-button uk-margin-large-left"
                class:uk-button-primary={validated}
                disabled={!validated}
                type="button" on:click={dispatchSignature}>Save</button>
    </div>
{/if}