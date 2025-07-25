<script>
    import {createEventDispatcher, onMount} from 'svelte'
    import {getAccounting} from '../stores/stats'
    import {DateTime} from 'luxon'
    import {screenWidthM, screenWidthS} from '../stores/navigation'


    let year = DateTime.now().year
    const minYear = 2022
    let stats = []

    const dispatch = createEventDispatcher()

    onMount(async ()=> {
        stats = await getAccounting(year)
    })

    async function changeYear(getYear) {
        stats = await getAccounting(getYear)
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'accounting'
        })
    }
</script>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">{ $screenWidthS ? '€€€' : $screenWidthM? 'Accounting' : 'Monthly accounting'}
            <span class="uk-position-right">
                {#if year > minYear}
                    <a on:click={() => changeYear(--year)} href="{'#'}" uk-icon="icon: chevron-double-left; ratio: 2"> </a>
                {:else}
                    <span uk-icon="icon: chevron-double-left; ratio: 2" class="uk-text-muted"></span>
                {/if}
                <span class="uk-text-bold">{year}</span>
                {#if year < DateTime.now().year}
                    <a on:click={() => changeYear(++year)} href="{'#'}" uk-icon="icon: chevron-double-right; ratio: 2"> </a>
                {:else}
                    <span uk-icon="icon: chevron-double-right; ratio: 2" class="uk-text-muted"></span>
                {/if}
            </span></h4>
        <div class="uk-margin-medium">
            {#if stats.length === 0}
                Loading Accounting stats...
            {:else}
                {#each stats as month}
                    <div class="uk-margin-medium uk-margin-large-top">
                        <h3 class="uk-heading-line uk-text-center uk-text-light" class:uk-text-muted={month.payments.length === 0}>
                            <span>{month.month}</span>
                        </h3>
                        {#if month.payments.length === 0}
                            <span class="uk-text-italic uk-text-muted">Nothing...</span>
                        {:else}
                            <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                                <thead>
                                <tr>
                                    <th>Paid</th>
                                    <th>Name</th>
                                    <th>Stay</th>
                                    <th>Invoice</th>
                                    <th>Baguette</th>
                                    <th>Squid</th>
                                </tr>
                                </thead>
                                <tbody>
                                {#each month.payments as payment}
                                    <tr>
                                        <td class="uk-table-shrink">{DateTime.fromSQL(payment.date_paid).toFormat('d.L.')}</td>
                                        <td class="">{payment.name}</td>
                                        <td class="uk-table-shrink">{payment.arrival  !== null ? DateTime.fromSQL(payment.arrival).toFormat('d.L.') : ''}-{payment.departure != null ? DateTime.fromSQL(payment.departure).toFormat('d.L.') : ''}</td>
                                        <td class="uk-table-shrink">{payment.invoice !== null ? payment.invoice : ''}</td>
                                        <td class="uk-table-shrink">{payment.baguette !== null ? payment.baguette : ''}</td>
                                        <td class="uk-table-shrink">{payment.squid !== null ? payment.squid : ''}</td>
                                    </tr>
                                {/each}
                                <tr style="border-top: 2px solid rgb(204, 204, 204); border-bottom: 4px double;">
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td class="uk-text-bold">TOTAL</td>
                                    <td>{month.total_baguette}</td>
                                    <td>{month.total_squid}</td>
                                </tr>
                                </tbody>
                            </table>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</div>