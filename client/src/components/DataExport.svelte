<script>
    import {onMount} from 'svelte'
    import {screenWidthL} from '../stores/navigation'
    import flatpickr from 'flatpickr'
    import {bookingsCSV, invoicesCSV} from '../stores/stats'


    let startDate = ''
    let endDate = ''
    let inputValid = false

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
                inputValid = startDate !== '' && endDate !== ''
            }
        })
    })

    async function getBookings() {
        await bookingsCSV(startDate, endDate)
    }

    async function getInvoices() {
        await invoicesCSV(startDate, endDate)
    }
</script>

<div class="uk-flex uk-flex-center">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-width-1-1">Data export</h4>
        <form class="uk-form" class:uk-form-horizontal={!$screenWidthL}>
            <div class="uk-margin-medium">
                <div class="uk-grid-small uk-margin-remove-left" uk-grid>
                    <div class="uk-width-1-5@s">
                        <label class="uk-form-label" for="form-start_date">Dates</label>
                    </div>
                    <div class="uk-width-4-5@s uk-form-controls uk-grid-small uk-margin-remove-left uk-padding-remove" id="form-dates" uk-grid>
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
                        <label class="uk-form-label" for="form-bookings">Bookings</label>
                    </div>
                    <div class="uk-width-2-5@s uk-text-small">
                        Booking data for selected date range (arrival date)
                    </div>
                    <div class="uk-width-2-5@s">
                        <button class="uk-button" type="button" id="form-bookings" disabled={!inputValid} class:uk-button-primary={inputValid}
                                on:click={getBookings}>Bookings</button>
                    </div>
                    <div class="uk-width-1-5@s">
                        <label class="uk-form-label" for="form-invoices">Invoices</label>
                    </div>
                    <div class="uk-width-2-5@s uk-text-small">
                        Invoice data (non-booking) for selected date range (paid date)
                    </div>
                    <div class="uk-width-2-5@s">
                        <button class="uk-button" type="button" id="form-invoices" disabled={!inputValid} class:uk-button-primary={inputValid}
                                on:click={getInvoices}>Invoices</button>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>