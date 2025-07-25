<svelte:head>
	<title>PAF Admin Central</title>
</svelte:head>
<svelte:window bind:innerWidth/>

<script>
	import 'uikit/dist/css/uikit.min.css'
	import 'flatpickr/dist/themes/light.css'
	import UIkit from 'uikit'
	import Icons from 'uikit/dist/js/uikit-icons'
	import Login from './components/Login.svelte'
	import NavBar from './components/NavBar.svelte'
	import Members from './components/Member.svelte'
	import {beforeUpdate} from 'svelte'
	import {validateAuth, loggedIn, fetchSettings} from './stores/api'
	import {getBookingNames} from './stores/booking'
	import {getMemberEmails, getMemberNames, getSciMembers} from './stores/member'
	import {navigation, screenWidthL, screenWidthM, screenWidthS, screenWidthXL} from './stores/navigation'
	import Booking from './components/Booking.svelte'
	import Invoice from './components/Invoice.svelte'
	import {getInvoiceNames, getInvoiceNumbers} from './stores/invoice'
	import Payment from './components/Payment.svelte'
	import Event from './components/Event.svelte'
	import {fetchEvents} from './stores/event'
	import Settings from './components/Settings.svelte'
	import Users from './components/Users.svelte'
	import Sci from './components/Sci.svelte'
	import Accounting from './components/Accounting.svelte'
	import Reservations from './components/Reservations.svelte'
	import Dashboard from './components/Dashboard.svelte'
	import Reconciliation from './components/Reconciliation.svelte'
	import BankRuns from './components/BankRuns.svelte'
	import {getBankruns} from './stores/bankrun'
	import Newsletter from './components/Newsletter.svelte'
	import DataExport from './components/DataExport.svelte'
	import DataImport from './components/DataImport.svelte'
	import Mattress from './components/Mattress.svelte'
	import {getAccounts, getMattressNames, getAllocatedNights, getIncome} from './stores/mattress'


	let didValidateAuth = false
	let reloadAccountingToggle = false
	let reloadBookingToggle = false
	let reloadEventToggle = false
	let reloadMemberToggle = false
	let reloadPaymentToggle = false
	let reloadInvoiceToggle = false
	let reloadMattressToggle = false
	let reloadReconciliationToggle = false
	let reloadBankrunToggle = false
	let reloadNewsletterToggle = false
	let reloadSciToggle = false
	let reloadSettingsToggle = false
	let reloadUsersToggle = false
	let innerWidth = 0

	$: $loggedIn && loadAppData()
	$: screenWidthS.set(innerWidth <= 640)
	$: screenWidthM.set(innerWidth > 640 && innerWidth <= 960)
	$: screenWidthL.set(innerWidth > 960 && innerWidth <= 1200)
	$: screenWidthXL.set(innerWidth > 1200)

	UIkit.use(Icons)

	beforeUpdate(() => {
		if (!didValidateAuth) {
			validateAuth()
			didValidateAuth = true
		}
	})

	function loadAppData() {
		if ($loggedIn.loggedIn) {
			fetchSettings()
			getBookingNames()
			getMattressNames()
			getMemberEmails()
			getMemberNames()
			getInvoiceNames()
			getInvoiceNumbers()
			fetchEvents()
			getSciMembers()
		}
	}

	async function reload(event) {
		if (event.detail.reload !== undefined) {
			switch (event.detail.reload) {
				case 'bankrun':
					await getBankruns()
					reloadBankrunToggle = !reloadBankrunToggle
					break
				case 'booking':
					await getBookingNames()
					await fetchEvents()
					await getSciMembers()
					reloadBookingToggle = !reloadBookingToggle
					break
				case 'event':
					await fetchEvents()
					reloadEventToggle = !reloadEventToggle
					break
				case 'invoice':
					await getInvoiceNames()
					await getInvoiceNumbers()
					await fetchSettings()
					reloadInvoiceToggle = !reloadInvoiceToggle
					break
				case 'mattress':
					await getMattressNames()
					await getAccounts()
					await getAllocatedNights()
					await getIncome()
					reloadMattressToggle = !reloadMattressToggle
					break
				case 'member':
					await getMemberEmails()
					await getMemberNames()
					reloadMemberToggle = !reloadMemberToggle
					break
				case 'newsletter':
					await fetchSettings()
					reloadNewsletterToggle = !reloadNewsletterToggle
					break
				case 'payment':
					await getInvoiceNames()
					await getInvoiceNumbers()
					await fetchSettings()
					await getSciMembers()
					reloadPaymentToggle = !reloadPaymentToggle
					break
				case 'sci':
					await getSciMembers()
					reloadSciToggle = !reloadSciToggle
					break
				case 'settings':
					await fetchSettings()
					reloadSettingsToggle = !reloadSettingsToggle
					break
				case 'users':
					reloadUsersToggle = !reloadUsersToggle
					break
			}
		}
	}
</script>

<style>
	body {
		margin:0;
		padding:0;
		min-width:100%;
		min-height:100%;
		overflow: auto;
	}
</style>

<body>
{#if !$loggedIn.loggedIn}
	<Login />
{:else}

	<NavBar />

	{#if $navigation.dashboard}
		<Dashboard/>
	{/if}
	{#if $navigation.booking}
		{#key reloadBookingToggle}
			<Booking on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.member}
		{#key reloadMemberToggle}
			<Members on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.payment}
		{#key reloadPaymentToggle}
			<Payment on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.mattress}
		{#key reloadMattressToggle}
			<Mattress on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.invoice}
		{#key reloadInvoiceToggle}
			<Invoice on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.event}
		{#key reloadEventToggle}
			<Event on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.reservations}
		<Reservations />
	{/if}
	{#if $navigation.newsletter}
		{#key reloadNewsletterToggle}
			<Newsletter />
		{/key}
	{/if}
	{#if $navigation.accounting}
		{#key reloadAccountingToggle}
			<Accounting on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.reconciliation}
		{#key reloadReconciliationToggle}
			<Reconciliation on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.bankrun}
		{#key reloadBankrunToggle}
			<BankRuns on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.sci}
		{#key reloadSciToggle}
			<Sci on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.data}
		<DataExport />
	{/if}
	{#if $navigation.datain}
		<DataImport />
	{/if}
	{#if $navigation.settings}
		{#key reloadSettingsToggle}
			<Settings on:message={reload} />
		{/key}
	{/if}
	{#if $navigation.users}
		{#key reloadUsersToggle}
			<Users on:message={reload} />
		{/key}
	{/if}
{/if}
</body>