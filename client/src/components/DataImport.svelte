<script>
    import {screenWidthL} from '../stores/navigation'
    import {importEmporiaCSV, importBookings} from '../stores/elasticsearch'
    import UIkit from 'uikit'
    import {onMount} from 'svelte'
    import flatpickr from 'flatpickr'

    let processing = false
    let startDate = ''
    let endDate = ''
    let dateInputValid = false
    let fileInputValid = false

    onMount(() => {
        flatpickr('#form-dates', {
            monthSelectorType: 'static',
            mode: 'range',
            onChange(selectedDates, dateStr) {
                startDate = dateStr.substring(0, 10)
                endDate = dateStr.substring(14)
                if (startDate !== '')
                    document.getElementById('form-start_date').focus()
                if (endDate !== '') {
                    document.getElementById('form-end_date').focus()
                    setTimeout(() => document.getElementById('form-start_date').blur(), 0)
                }
                dateInputValid = startDate !== '' && endDate !== ''
            }
        })

        let fileInput = document.getElementById('emporia-csv')
        fileInput.addEventListener('change', () => fileInputValid = fileInput.files.length > 0)
    })

    async function handleBookingsImport() {
        processing = true
        const result = await importBookings(startDate, endDate)
        processing = false
        if (result.status && result.status === 200)
            UIkit.notification('<span uk-icon="icon: check"></span> Successfully ingested!', {status:'success', pos: 'bottom-center'});
        else
            UIkit.notification('<span uk-icon="icon: warning"></span> Failed! ' + result.data, {status: 'danger', pos: 'bottom-center'});
    }

    async function handleEmporiaCSV() {
        processing = true
        const result = await importEmporiaCSV(new FormData(document.querySelector('form')))
        processing = false
        if (result.status && result.status === 200)
            UIkit.notification('<span uk-icon="icon: check"></span> Successfully ingested!', {status:'success', pos: 'bottom-center'});
        else
            UIkit.notification('<span uk-icon="icon: warning"></span> Failed! ' + result.data, {status: 'danger', pos: 'bottom-center'});
    }
</script>

{#if processing}
    <div class="uk-flex uk-flex-center uk-margin-xlarge-top">
        <div uk-spinner="ratio: 3"></div>
    </div>
{:else}
    <div class="uk-flex uk-flex-center">
        <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
            <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-width-1-1">Elasticsearch import</h4>
            <form class="uk-form" class:uk-form-horizontal={!$screenWidthL}>
                <div class="uk-margin-medium">
                    <div class="uk-grid-small uk-margin-remove-left" uk-grid>
                        <div class="uk-width-1-5@s">
                            <label class="uk-form-label" for="form-start_date">Emporia CSV</label>
                        </div>
                        <div class="uk-width-3-5@s uk-text-small">
                            <input type="file" name="emporia-csv" id="emporia-csv" />
                        </div>
                        <div class="uk-width-1-5@s">
                            <button class="uk-button uk-button-primary uk-width-1-1" disabled={!fileInputValid} on:click={handleEmporiaCSV}>Upload</button>
                        </div>

                        <div class="uk-width-1-5@s">
                            <label class="uk-form-label" for="form-start_date">Bookings</label>
                        </div>
                        <div class="uk-width-3-5@s uk-form-controls uk-grid-small uk-margin-remove-left uk-padding-remove" id="form-dates" uk-grid>
                            <div class="uk-width-1-3@s">
                                <input class="uk-input" id="form-start_date" type="text" placeholder="Start date" readonly style="color: black"
                                       bind:value={startDate}>
                            </div>
                            <div class="uk-width-1-3@s">
                                <input class="uk-input" id="form-end_date" type="text" placeholder="End date" readonly style="color: black"
                                       bind:value={endDate}>
                            </div>
                        </div>
                        <div class="uk-width-1-5@s">
                            <button class="uk-button uk-button-primary uk-width-1-1" disabled={!dateInputValid} on:click={handleBookingsImport}>Import</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
{/if}