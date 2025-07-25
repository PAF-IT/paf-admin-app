<script>
    import {createEventDispatcher, onMount} from "svelte"
    import InfiniteScroll from "svelte-infinite-scroll"
    import * as SimpleSwitch from "a-simple-switch"
    import {screenWidthL, screenWidthM, screenWidthS} from "../stores/navigation"
    import autoComplete from "@tarekraafat/autocomplete.js/dist/autoComplete"
    import {DateTime} from "luxon"
    import {
        getInvoices,
        getReconciliationInvoices,
        invoiceNames,
        updateInvoice
    } from "../stores/invoice"
    import flatpickr from "flatpickr"
    import UIkit from "uikit";
    import BankRunSheet from "./BankRunSheet.svelte";
    import {getBankruns} from "../stores/bankrun";


    let page = 1
    let maxPage = 2
    let data = []
    let newBatch = []
    let selectedBankRun = null
    let recreateForm = true

    $: data = [...data, ...newBatch]

    const dispatch = createEventDispatcher()

    onMount(async () => await fetchData())

    async function fetchData() {
        const response = await getBankruns(page)
        maxPage = response.meta.last_page
        newBatch = await response.data
    }

    function openForm(bankRun) {
        selectedBankRun = bankRun instanceof MouseEvent ? null : JSON.parse(JSON.stringify(bankRun))
        recreateForm = !recreateForm
        UIkit.modal("#modal-bank-run").show()
    }

    function closeForm(event) {
        if (event.detail.goto !== undefined) {
            switch (event.detail.goto) {
                case 'cancel':
                    UIkit.modal("#modal-bank-run").hide()
                    dispatchReload()
            }
        }
    }

    function dispatchReload() {
        dispatch('message', {
            reload: 'bankrun'
        })
    }
</script>


<div class="uk-flex uk-flex-center" style="max-height: 90%; overflow-x: scroll;">
    <div class="uk-section uk-section-xsmall uk-margin-medium-top uk-margin-bottom uk-width-2-3@m uk-width-5-6">
        <h4 class="uk-heading-small uk-heading-divider uk-text-light uk-margin-medium-bottom uk-inline uk-width-1-1">{ $screenWidthS || $screenWidthM ? 'Deposits' : 'Bank deposits'}
            <span class="uk-position-right">
                <button on:click={openForm} class="uk-button uk-button-primary uk-margin-medium-left"><span uk-icon="icon: plus; ratio: 0.6"></span> Deposit sheet</button>
            </span></h4>
        <div class="uk-margin-medium">
            {#if data.length === 0 }
                Loading bank deposits...
            {:else }
                <table class="uk-table uk-table-striped uk-table-hover uk-table-small uk-text-small">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Invoices</th>
                        <th class="uk-text-nowrap">Total cash</th>
                        <th class="uk-text-nowrap">Total cheque</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each data as bankrun}
                        <tr class="uk-table-link">
                            <td on:click={() => openForm(bankrun)} class="uk-text-nowrap">{DateTime.fromSQL(bankrun.date).toFormat('dd LLL yyyy')}</td>
                            <td on:click={() => openForm(bankrun)}>{bankrun.invoices.join(', ')}</td>
                            <td on:click={() => openForm(bankrun)} class="uk-table-shrink uk-text-nowrap">{bankrun.total_amount_cash}</td>
                            <td on:click={() => openForm(bankrun)} class="uk-table-shrink uk-text-nowrap">{bankrun.total_amount_cheque}</td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            {/if}
        </div>
        <InfiniteScroll hasMore={newBatch.length} threshold={80} on:loadMore={() => {
        if (page < maxPage) {
            page++
            fetchData()
        }
    }}/>
    </div>
</div>


<!-- BANK RUN form modal -->

<div id="modal-bank-run"
     class:uk-margin-auto-vertical={!$screenWidthM}
     class="uk-modal-full" uk-modal="esc-close: false; bg-close: false">

    <div class="uk-modal-dialog uk-overflow-auto uk-width-3-4@m">
        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
        <div class="uk-flex uk-flex-center">
            <div class="uk-padding-large uk-width-3-5@xl uk-width-2-3@l uk-width-5-6" uk-height-viewport>
                {#key recreateForm}
                    <BankRunSheet bind:bankRun={selectedBankRun} on:message={closeForm} />
                {/key}
            </div>
        </div>
    </div>
</div>