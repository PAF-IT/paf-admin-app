<script>
    import {onMount} from 'svelte'
    import {getReservationList} from '../stores/booking'
    import {DateTime} from 'luxon'
    import {screenWidthS} from '../stores/navigation'
    import UIkit from 'uikit'

    let year = DateTime.now().year
    const minYear = 2022
    let reservations = {}

    onMount(async () => {
        reservations = await getReservationList(year)
    })

    async function changeYear(getYear) {
        reservations = await getReservationList(getYear)
    }

    async function copyList() {
        if (reservations.data) {
            await navigator.clipboard.writeText(reservations.data.join('\n'))
            UIkit.notification('<span uk-icon="icon: check"></span> List copied!', {
                status: 'success',
                pos: 'bottom-center'
            })
        }
    }
</script>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">{ $screenWidthS ? 'List' : 'Reservations'}
            <span class="uk-position-right">
                {#if year > minYear}
                    <a on:click={() => changeYear(--year)} href="{'#'}" uk-icon="icon: chevron-double-left; ratio: 2"> </a>
                {:else}
                    <span uk-icon="icon: chevron-double-left; ratio: 2" class="uk-text-muted"></span>
                {/if}
                <span class="uk-text-bold">{year}</span>
                {#if year <= DateTime.now().year}
                    <a on:click={() => changeYear(++year)} href="{'#'}" uk-icon="icon: chevron-double-right; ratio: 2"> </a>
                {:else}
                    <span uk-icon="icon: chevron-double-right; ratio: 2" class="uk-text-muted"></span>
                {/if}
            </span></h4>
        <div class="uk-margin-medium uk-inline uk-width-expand">
            {#if reservations.data === undefined}
                Loading reservations...
            {:else}
                {#if reservations.data.length === 0}
                    No reservations yet
                {:else }
                    <a href="{'#'}" on:click={copyList}><span class="uk-position-top-right" uk-icon="icon: copy" uk-tooltip="Copy list"></span></a>
                    {#each reservations.data as reservation}
                        {reservation}<br>
                    {/each}
                {/if}
            {/if}
        </div>
    </div>
</div>