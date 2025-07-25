<script>
    import {createEventDispatcher, onDestroy, onMount} from 'svelte'
    import {DateTime} from 'luxon'
    import {getNewsletterEmails} from '../stores/member'
    import flatpickr from 'flatpickr'
    import {screenWidthL, screenWidthM, screenWidthS} from '../stores/navigation'
    import UIkit from 'uikit'
    import {settings, updateSettings} from '../stores/api'


    const dispatch = createEventDispatcher()

    let lastRetrieval = DateTime.now().toSQLDate()
    let list = []

    onMount(() => {

        lastRetrieval = $settings.last_newsletter_retrieval

        flatpickr('#form-date', {
            monthSelectorType: 'static',
            defaultDate: lastRetrieval
        })
    })

    async function getList() {
        lastRetrieval = document.getElementById('form-date').value
        list = await getNewsletterEmails(lastRetrieval)
        $settings.last_newsletter_retrieval = lastRetrieval
        await updateSettings($settings)
        dispatch('message', {
            reload: 'newsletter'
        })
    }

    async function copyList() {
        await navigator.clipboard.writeText(list.join('\n'))
        UIkit.notification('<span uk-icon="icon: check"></span> Emails copied!', {status:'success', pos: 'bottom-center'})
    }
</script>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">{$screenWidthS || $screenWidthM || $screenWidthL ? 'Emails' : 'Newsletter emails'}
            <span class="uk-position-center-right uk-text-default">
                <input class="uk-input uk-form-width-medium" id="form-date" name="date" type="text" placeholder="Start Date" readOnly style="color: black"
                       bind:value={lastRetrieval}>
            <button class="uk-button uk-button-primary uk-margin-left" id="submit" on:click={getList}>Get list</button>
            </span></h4>
        <div class="uk-margin-medium uk-inline uk-width-expand">
            {#if list.length === 0}
                Please select a start date
            {:else}
                <a href="{'#'}" on:click={copyList}><span class="uk-position-top-right" uk-icon="icon: copy" uk-tooltip="Copy emails"></span></a>
                {#each list as email}
                    {email}<br>
                {/each}
            {/if}
        </div>
    </div>
</div>