<script>
    import {onMount} from 'svelte'
    import {getDayStats, getStats} from '../stores/stats'
    import {DateTime} from 'luxon'
    import {screenWidthL, screenWidthM, screenWidthS, screenWidthXL} from '../stores/navigation'
    import DashD3 from './DashD3.svelte'
    import flatpickr from 'flatpickr'


    let data = []
    let period = 20
    let startDate = DateTime.now().minus({days: 1})
    let endDate = DateTime.now().plus({days: period})
    let selectedDay = DateTime.now().toSQLDate()
    let dayData = []

    $: endDate && fetchData()
    $: ($screenWidthS || $screenWidthM || $screenWidthL || $screenWidthXL) && adjustPeriodWidth()

    onMount(async () => {
        await fetchData()
        dayData = await getDayStats(selectedDay)

        flatpickr('#date-select', {
            monthSelectorType: 'static',
            mode: 'range',
            defaultDate: [startDate.toISODate(), endDate.toISODate()],
            onChange(selectedDates, dateStr) {
                startDate = DateTime.fromFormat(dateStr.substring(0, 10), 'y-LL-dd')
                endDate = DateTime.fromFormat(dateStr.substring(14), 'y-LL-dd')
                selectedDay = startDate.toSQLDate()
                document.getElementById('date-select').blur()
            }
        })
    })

    function adjustPeriodWidth() {
        period = $screenWidthS ? 7 : $screenWidthM ? 14 : $screenWidthL ? 21 : 28
        endDate = startDate.plus({days:period})
        fetchData()
    }

    async function fetchData() {
        if (endDate.diff(startDate).shiftTo('days').days < period)
            endDate = startDate.plus({days:period})
        data = await getStats(startDate, endDate)
        if (startDate.toSQLDate() > selectedDay || endDate.toSQL() < selectedDay) {
            selectedDay = startDate.toSQLDate()
            dayData = await getDayStats(selectedDay)
        }
    }

    async function scroll(amount) {
        startDate = startDate.plus({days: amount})
        endDate = endDate.plus({days: amount})
        await fetchData()
    }

    async function fetchDayStats(event) {
        if (event.detail.select !== undefined) {
            selectedDay = event.detail.select
            dayData = await getDayStats(event.detail.select)
        }
    }

    function selectDatePicker() {
        document.getElementById('date-select').focus()
    }

</script>

<style>
    #tooltip {
        position: absolute;
        background-color: white;
        font-size: 0.75em;
        border-radius: 4px;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, .5);
        z-index: 1000;
    }
    .hidden {
        display: none;
    }
</style>

<div class="uk-flex uk-flex-center uk-margin-large-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6 paf-top-section-bg">
        <div class="uk-flex uk-flex-center uk-flex-middle">
            <div class="paf-arrow-circle uk-margin-small-right"><a on:click={() => scroll(-7)} href="{'#'}" uk-icon="icon: chevron-left" uk-tooltip="- 7 days"> </a></div>
            <span class="uk-text-lead uk-margin-left uk-margin-small-right" on:click={() => selectDatePicker()}>{DateTime.fromISO(selectedDay).toFormat('dd LLL yyyy')}</span>
            <div class="uk-inline">
                <a on:click={() => selectDatePicker()} href="{'#'}" uk-icon="icon: calendar" class="uk-position-center" uk-tooltip="Select date range"> </a>
                <input class="uk-input uk-form-blank uk-form-width-xsmall" id="date-select" type="text" readonly style="color: transparent">
            </div>
            <div class="paf-arrow-circle uk-margin-small-left"><a on:click={() => scroll(+7)} href="{'#'}" uk-icon="icon: chevron-right" uk-tooltip="+ 7 days"> </a></div>
        </div>
    </div>
</div>

<div class="uk-flex uk-flex-center uk-margin-top uk-margin-bottom">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">
        {#if data.length === 0}
            Loading data...
        {:else }
            <DashD3 bind:data bind:selectedDay on:message={fetchDayStats} />
        {/if}
    </div>
</div>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-width-4-5@m uk-width-5-6">
        {#each dayData as category}
            {#if category.details.length > 0}
                <div class="uk-margin-medium uk-margin-top">
                    <h3 class="uk-heading-line uk-text-center uk-text-light" class:uk-text-muted={category.count === 0}><span> &nbsp;{category.label + ': ' + category.count}&nbsp; </span></h3>
                    <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th class="uk-table-shrink">People</th>
                            <th>Stay</th>
                            <th class="uk-visible@s uk-table-shrink">Notes</th>
                            <th class="uk-visible@m">{$screenWidthL ? '' : 'PAF '}Events</th>
                            <th class="uk-visible@l">Group</th>
                        </tr>
                        </thead>
                        <tbody>
                        {#each category.details as details}
                            <tr class="uk-table-link" class:uk-text-muted={details.cancelled} class:strikethrough={details.cancelled}>
                                <td>{details.name}</td>
                                <td>{details.people_count}</td>
                                <td class="">{DateTime.fromISO(details.arrival).toFormat('dd LLL yyyy') + ' - ' + DateTime.fromISO(details.departure).toFormat('dd LLL yyyy')}</td>
                                <td class="uk-visible@s">{#if details.info}<span uk-icon="icon: info" uk-tooltip="title: {details.info.trim()}"> </span>{/if}</td>
                                <td class="uk-visible@m">
                                    {#if details.events.length > 0}
                                        {#each details.events as event}
                                            <span class="uk-label" class:uk-label-success={event.confirmed} class:uk-label-warning={!event.confirmed}>{event.abbreviation}</span>&nbsp;
                                        {/each}
                                    {/if}
                                </td>
                                <td class="uk-visible@l">
                                    {#if details.group_name !== null}
                                        <span class="uk-label uk-background-secondary">{details.group_name}</span>&nbsp;
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        {/each}
    </div>
</div>

<div id="tooltip" class="hidden">
    <div style='padding-top: 4px; padding-bottom: 2px;'>
        <table>
            <tr>
                <td style="padding-left: 8px;"></td>
                <td><strong id="tooltipHead"></strong></td>
            </tr>
        </table>
    </div>
    <div style='border-top-style: solid; border-width: 1px; border-color: darkgrey; padding: 4px;'>
        <table>
            <tbody id="tooltipArrivalDeparture"></tbody>
        </table>
    </div>
    <div style='border-top-style: solid; border-width: 1px; border-color: darkgrey; padding: 4px;'>
        <table>
            <tbody id="tooltipStayers"></tbody>
        </table>
    </div>
    <div id="tooltipWaitingListDiv" style='border-top-style: solid; border-width: 1px; border-color: darkgrey; padding: 4px;' class="hidden">
        <table>
            <tbody id="tooltipWaitingList"></tbody>
        </table>
    </div>
</div>