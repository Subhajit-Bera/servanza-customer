// import React, { useEffect, useState, useCallback } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     ScrollView,
//     TouchableOpacity,
//     Image,
//     ActivityIndicator,
//     Share,
//     FlatList,
// } from 'react-native';
// import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
// import { useAppDispatch, useAppSelector } from '../../store/hooks';
// import { fetchServiceById, clearSelectedService } from '../../store/slices/servicesSlice';
// import { addToCart } from '../../store/slices/cartSlice';
// import { addToFavorites, removeFromFavorites } from '../../store/slices/favoritesSlice';
// import { servicesApi } from '../../api/client';
// import type { HomeStackParamList } from '../../navigation/MainNavigator';
// import type { Review } from '../../types';

// type ServiceDetailsRouteProp = RouteProp<HomeStackParamList, 'ServiceDetails'>;
// type ServiceDetailsNavigationProp = StackNavigationProp<HomeStackParamList, 'ServiceDetails'>;

// const ServiceDetailsScreen: React.FC = () => {
//     const navigation = useNavigation<ServiceDetailsNavigationProp>();
//     const route = useRoute<ServiceDetailsRouteProp>();
//     const dispatch = useAppDispatch();
//     const insets = useSafeAreaInsets();

//     const { serviceId } = route.params;
//     const { selectedService: service, loading } = useAppSelector((state) => state.services);
//     const cartItems = useAppSelector((state) => state.cart.items);
//     const favoriteIds = useAppSelector((state) => state.favorites.favoriteIds);

//     const cartItem = cartItems.find(item => item.service.id === serviceId);
//     const quantityInCart = cartItem?.quantity || 0;
//     const isFavorite = favoriteIds.includes(serviceId);

//     // Metadata
//     const metadata = service?.metadata;

//     // Reviews state
//     const [reviews, setReviews] = useState<Review[]>([]);
//     const [reviewsLoading, setReviewsLoading] = useState(false);
//     const [showDescription, setShowDescription] = useState(false);

//     useEffect(() => {
//         dispatch(fetchServiceById(serviceId));
//         return () => {
//             dispatch(clearSelectedService());
//         };
//     }, [serviceId]);

//     // Fetch reviews
//     const fetchReviews = useCallback(async () => {
//         setReviewsLoading(true);
//         try {
//             const { data: responseData } = await servicesApi.getServiceReviews(serviceId, 1, 5);
//             const payload = responseData?.data || responseData;
//             setReviews(Array.isArray(payload) ? payload : (payload?.reviews || []));
//         } catch (error) {
//             console.error('Failed to fetch reviews:', error);
//         } finally {
//             setReviewsLoading(false);
//         }
//     }, [serviceId]);

//     useEffect(() => {
//         fetchReviews();
//     }, [fetchReviews]);

//     const handleAddToCart = () => {
//         if (service) {
//             dispatch(addToCart({ service, quantity: 1 }));
//         }
//     };

//     const handleBookNow = () => {
//         if (service) {
//             dispatch(addToCart({ service, quantity: 1 }));
//             navigation.getParent()?.navigate('CartTab');
//         }
//     };

//     const handleToggleFavorite = () => {
//         if (!service) return;
//         if (isFavorite) {
//             dispatch(removeFromFavorites(serviceId));
//         } else {
//             dispatch(addToFavorites(service));
//         }
//     };

//     const handleShare = async () => {
//         if (!service) return;
//         try {
//             await Share.share({
//                 title: service.title,
//                 message: `Check out ${service.title} on Servanza! Starting at ${formatCurrency(service.basePrice)}`,
//             });
//         } catch (error) {
//             console.error('Share error:', error);
//         }
//     };

//     // Computed values
//     const displayPrice = service?.basePrice || 0;
//     const displayDuration = service?.durationMins || 0;
    
//     // Parse description object
//     const descObj = service?.description || {};
//     const displayDescription = typeof descObj === 'string' ? descObj : (descObj.description || '');
    
//     // Arrays strictly typed to match your updated ServiceDescription interface
//     const whatsIncluded: string[] = typeof descObj === 'object' ? (descObj.whatsIncluded || []) : [];
//     const whatsNotIncluded: string[] = typeof descObj === 'object' ? (descObj.whatsNotIncluded || []) : [];
//     const productsWeUse: string[] = typeof descObj === 'object' ? (descObj.productsWeUse || []) : [];
//     const productsNeeded: string[] = typeof descObj === 'object' ? (descObj.productsNeededFromCustomer || []) : [];

//     const avgRating = service?.averageRating;
//     const totalReviews = service?.totalReviews || 0;

//     const getTimeAgo = (dateStr: string) => {
//         const now = new Date();
//         const d = new Date(dateStr);
//         const diffMs = now.getTime() - d.getTime();
//         const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
//         if (days === 0) return 'Today';
//         if (days === 1) return '1 day ago';
//         if (days < 30) return `${days}d ago`;
//         const months = Math.floor(days / 30);
//         return months === 1 ? '1 month ago' : `${months} months ago`;
//     };

//     if (loading || !service) {
//         return (
//             <SafeAreaView style={[styles.container, styles.loadingContainer]}>
//                 <ActivityIndicator size="large" color={COLORS.primary} />
//             </SafeAreaView>
//         );
//     }

//     return (
//         <SafeAreaView style={styles.container} edges={['top']}>
//             <ScrollView
//                 style={styles.scrollView}
//                 contentContainerStyle={styles.scrollContent}
//                 showsVerticalScrollIndicator={false}
//             >
//                 {/* Header Image */}
//                 <View style={styles.imageContainer}>
//                     {service.imageUrl ? (
//                         <Image source={{ uri: service.imageUrl }} style={styles.image} />
//                     ) : (
//                         <View style={styles.imagePlaceholder}>
//                             <Ionicons name="construct" size={60} color={COLORS.textLight} />
//                         </View>
//                     )}

//                     {/* Header Buttons Overlay */}
//                     <View style={[styles.headerOverlay, { paddingTop: insets.top + SPACING.sm }]}>
//                         <TouchableOpacity
//                             style={styles.iconButton}
//                             onPress={() => navigation.goBack()}
//                         >
//                             <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
//                         </TouchableOpacity>
//                         <View style={styles.headerRight}>
//                             <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
//                                 <Ionicons
//                                     name={isFavorite ? "heart" : "heart-outline"}
//                                     size={24}
//                                     color={isFavorite ? COLORS.error : COLORS.textPrimary}
//                                 />
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
//                                 <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>

//                 {/* Content */}
//                 <View style={styles.contentContainer}>
//                     <View style={styles.headerSection}>
//                         <View style={styles.titleRow}>
//                             <View style={styles.categoryTag}>
//                                 <Text style={styles.categoryText}>
//                                     {service.category?.name || 'Service'}
//                                 </Text>
//                             </View>
//                             <View style={styles.ratingContainer}>
//                                 <Ionicons name="star" size={16} color={COLORS.star} />
//                                 <Text style={styles.ratingText}>
//                                     {avgRating ? `${avgRating} (${totalReviews} reviews)` : 'New'}
//                                 </Text>
//                             </View>
//                         </View>

//                         <Text style={styles.title}>{service.title}</Text>

//                         <View style={styles.priceContainer}>
//                             <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
//                             <View style={styles.dot} />
//                             <View style={styles.durationContainer}>
//                                 <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
//                                 <Text style={styles.durationText}>{displayDuration} mins</Text>
//                             </View>
//                         </View>
//                     </View>

//                     <View style={styles.divider} />

//                     {/* About */}
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>About this service</Text>
//                         <Text style={styles.description} numberOfLines={showDescription ? undefined : 4}>
//                             {displayDescription || 'Professional service with verified experts.'}
//                         </Text>
//                         {displayDescription.length > 150 && (
//                             <TouchableOpacity onPress={() => setShowDescription(!showDescription)}>
//                                 <Text style={styles.readMoreText}>
//                                     {showDescription ? 'Show less' : 'Read more'}
//                                 </Text>
//                             </TouchableOpacity>
//                         )}
//                     </View>

//                     {/* What's Included */}
//                     {whatsIncluded.length > 0 && (
//                         <View style={styles.section}>
//                             <Text style={styles.sectionTitle}>What's included</Text>
//                             <View style={styles.featuresList}>
//                                 {whatsIncluded.map((feature: string, index: number) => (
//                                     <View key={index} style={styles.featureItem}>
//                                         <View style={styles.checkIcon}>
//                                             <Ionicons name="checkmark" size={12} color={COLORS.white} />
//                                         </View>
//                                         <Text style={styles.featureText}>{feature}</Text>
//                                     </View>
//                                 ))}
//                             </View>
//                         </View>
//                     )}

//                     {/* What's Not Included */}
//                     {whatsNotIncluded.length > 0 && (
//                         <View style={styles.section}>
//                             <Text style={styles.sectionTitle}>What's not included</Text>
//                             <View style={styles.featuresList}>
//                                 {whatsNotIncluded.map((feature: string, index: number) => (
//                                     <View key={index} style={styles.featureItem}>
//                                         <View style={styles.excludeIcon}>
//                                             <Ionicons name="close" size={12} color={COLORS.textLight} />
//                                         </View>
//                                         <Text style={[styles.featureText, { color: COLORS.textLight }]}>
//                                             {feature}
//                                         </Text>
//                                     </View>
//                                 ))}
//                             </View>
//                         </View>
//                     )}

//                     {/* Products We Use */}
//                     {productsWeUse.length > 0 && (
//                         <View style={styles.section}>
//                             <Text style={styles.sectionTitle}>Products We Use</Text>
//                             <View style={styles.featuresList}>
//                                 {productsWeUse.map((feature: string, index: number) => (
//                                     <View key={index} style={styles.featureItem}>
//                                         <View style={styles.checkIcon}>
//                                             <Ionicons name="flask" size={12} color={COLORS.white} />
//                                         </View>
//                                         <Text style={styles.featureText}>{feature}</Text>
//                                     </View>
//                                 ))}
//                             </View>
//                         </View>
//                     )}

//                     {/* Products Needed from Customer */}
//                     {productsNeeded.length > 0 && (
//                         <View style={styles.section}>
//                             <Text style={styles.sectionTitle}>Things We Need From You</Text>
//                             <View style={styles.featuresList}>
//                                 {productsNeeded.map((feature: string, index: number) => (
//                                     <View key={index} style={styles.featureItem}>
//                                         <View style={[styles.checkIcon, { backgroundColor: COLORS.warning || '#F59E0B' }]}>
//                                             <Ionicons name="basket" size={12} color={COLORS.white} />
//                                         </View>
//                                         <Text style={styles.featureText}>{feature}</Text>
//                                     </View>
//                                 ))}
//                             </View>
//                         </View>
//                     )}

//                     {/* Reviews Preview */}
//                     <View style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <Text style={styles.sectionTitle}>Reviews</Text>
//                             {totalReviews > 0 && (
//                                 <TouchableOpacity>
//                                     <Text style={styles.seeAllText}>See all</Text>
//                                 </TouchableOpacity>
//                             )}
//                         </View>

//                         {reviewsLoading ? (
//                             <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 20 }} />
//                         ) : reviews.length > 0 ? (
//                             <FlatList
//                                 data={reviews.slice(0, 3)}
//                                 horizontal
//                                 showsHorizontalScrollIndicator={false}
//                                 keyExtractor={(item) => item.id}
//                                 contentContainerStyle={{ gap: SPACING.md }}
//                                 renderItem={({ item }) => {
//                                     const initials = item.user?.name
//                                         ? item.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
//                                         : '??';
//                                     return (
//                                         <View style={styles.reviewCard}>
//                                             <View style={styles.reviewHeader}>
//                                                 <View style={styles.reviewerInfo}>
//                                                     <View style={styles.reviewerAvatar}>
//                                                         {item.user?.profileImage ? (
//                                                             <Image
//                                                                 source={{ uri: item.user.profileImage }}
//                                                                 style={styles.reviewerAvatarImage}
//                                                             />
//                                                         ) : (
//                                                             <Text style={styles.avatarText}>{initials}</Text>
//                                                         )}
//                                                     </View>
//                                                     <View>
//                                                         <Text style={styles.elementName}>
//                                                             {item.user?.name || 'Anonymous'}
//                                                         </Text>
//                                                         <Text style={styles.reviewDate}>
//                                                             {getTimeAgo(item.createdAt)}
//                                                         </Text>
//                                                     </View>
//                                                 </View>
//                                                 <View style={styles.ratingBadge}>
//                                                     <Text style={styles.ratingBadgeText}>
//                                                         {item.rating.toFixed(1)}
//                                                     </Text>
//                                                     <Ionicons name="star" size={10} color={COLORS.white} />
//                                                 </View>
//                                             </View>
//                                             {item.comment && (
//                                                 <Text style={styles.reviewText} numberOfLines={3}>
//                                                     {item.comment}
//                                                 </Text>
//                                             )}
//                                         </View>
//                                     );
//                                 }}
//                             />
//                         ) : (
//                             <View style={styles.noReviews}>
//                                 <Ionicons name="chatbubble-outline" size={32} color={COLORS.textLight} />
//                                 <Text style={styles.noReviewsText}>No reviews yet</Text>
//                             </View>
//                         )}
//                     </View>
//                 </View>
//             </ScrollView>

//             {/* Bottom Bar */}
//             <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
//                 <View style={styles.bottomBarContent}>
//                     <TouchableOpacity
//                         style={styles.cartButton}
//                         onPress={handleAddToCart}
//                     >
//                         <View style={styles.cartIconWrapper}>
//                             <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
//                             {quantityInCart > 0 && (
//                                 <View style={styles.badge}>
//                                     <Text style={styles.badgeText}>{quantityInCart}</Text>
//                                 </View>
//                             )}
//                         </View>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                         style={styles.bookButton}
//                         onPress={handleBookNow}
//                     >
//                         <Text style={styles.bookButtonText}>Book Now</Text>
//                     </TouchableOpacity>
//                 </View>
//             </SafeAreaView>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: COLORS.background,
//     },
//     loadingContainer: {
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     scrollView: {
//         flex: 1,
//     },
//     scrollContent: {
//         paddingBottom: 100,
//     },
//     imageContainer: {
//         height: 300,
//         backgroundColor: COLORS.inputBackground,
//         position: 'relative',
//     },
//     image: {
//         width: '100%',
//         height: '100%',
//         resizeMode: 'cover',
//     },
//     imagePlaceholder: {
//         width: '100%',
//         height: '100%',
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: COLORS.inputBackground,
//     },
//     headerOverlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingHorizontal: SPACING.lg,
//     },
//     headerRight: {
//         flexDirection: 'row',
//         gap: SPACING.md,
//     },
//     iconButton: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: 'rgba(255, 255, 255, 0.9)',
//         justifyContent: 'center',
//         alignItems: 'center',
//         ...SHADOWS.light,
//     },
//     contentContainer: {
//         flex: 1,
//         backgroundColor: COLORS.background,
//         borderTopLeftRadius: BORDER_RADIUS.xxl,
//         borderTopRightRadius: BORDER_RADIUS.xxl,
//         marginTop: -30,
//         paddingHorizontal: SPACING.lg,
//         paddingTop: SPACING.xxl,
//     },
//     headerSection: {
//         marginBottom: SPACING.xl,
//     },
//     titleRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: SPACING.sm,
//     },
//     categoryTag: {
//         backgroundColor: COLORS.primaryLight,
//         paddingHorizontal: SPACING.md,
//         paddingVertical: SPACING.xs,
//         borderRadius: BORDER_RADIUS.sm,
//     },
//     categoryText: {
//         fontSize: TYPOGRAPHY.fontSize.xs,
//         color: COLORS.primary,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         textTransform: 'uppercase',
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 4,
//     },
//     ratingText: {
//         fontSize: TYPOGRAPHY.fontSize.sm,
//         color: COLORS.textSecondary,
//         fontWeight: TYPOGRAPHY.fontWeight.medium,
//     },
//     title: {
//         fontSize: TYPOGRAPHY.fontSize.hero,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         color: COLORS.textPrimary,
//         marginBottom: SPACING.sm,
//     },
//     priceContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: SPACING.md,
//     },
//     price: {
//         fontSize: TYPOGRAPHY.fontSize.xxl,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         color: COLORS.primary,
//     },
//     dot: {
//         width: 4,
//         height: 4,
//         borderRadius: 2,
//         backgroundColor: COLORS.textLight,
//     },
//     durationContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//     },
//     durationText: {
//         fontSize: TYPOGRAPHY.fontSize.md,
//         color: COLORS.textSecondary,
//     },
//     divider: {
//         height: 1,
//         backgroundColor: COLORS.divider,
//         marginBottom: SPACING.xl,
//     },
//     section: {
//         marginBottom: SPACING.xxl,
//     },
//     sectionHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: SPACING.md,
//     },
//     sectionTitle: {
//         fontSize: TYPOGRAPHY.fontSize.xl,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         color: COLORS.textPrimary,
//         marginBottom: SPACING.sm,
//     },
//     seeAllText: {
//         fontSize: TYPOGRAPHY.fontSize.sm,
//         color: COLORS.primary,
//         fontWeight: TYPOGRAPHY.fontWeight.semibold,
//     },
//     description: {
//         fontSize: TYPOGRAPHY.fontSize.md,
//         color: COLORS.textSecondary,
//         lineHeight: 24,
//     },
//     readMoreText: {
//         fontSize: TYPOGRAPHY.fontSize.sm,
//         color: COLORS.primary,
//         fontWeight: TYPOGRAPHY.fontWeight.semibold,
//         marginTop: SPACING.xs,
//     },
//     featuresList: {
//         gap: SPACING.md,
//     },
//     featureItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: SPACING.md,
//         backgroundColor: COLORS.white,
//         padding: SPACING.md,
//         borderRadius: BORDER_RADIUS.lg,
//         borderWidth: 1,
//         borderColor: COLORS.border,
//     },
//     checkIcon: {
//         width: 20,
//         height: 20,
//         borderRadius: 10,
//         backgroundColor: COLORS.primary,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     excludeIcon: {
//         width: 20,
//         height: 20,
//         borderRadius: 10,
//         backgroundColor: COLORS.inputBackground,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     featureText: {
//         flex: 1,
//         fontSize: TYPOGRAPHY.fontSize.md,
//         color: COLORS.textPrimary,
//         fontWeight: TYPOGRAPHY.fontWeight.medium,
//     },
//     reviewCard: {
//         backgroundColor: COLORS.white,
//         padding: SPACING.lg,
//         borderRadius: BORDER_RADIUS.xl,
//         borderWidth: 1,
//         borderColor: COLORS.border,
//         width: 280,
//     },
//     reviewHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         marginBottom: SPACING.md,
//     },
//     reviewerInfo: {
//         flexDirection: 'row',
//         gap: SPACING.md,
//     },
//     reviewerAvatar: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: COLORS.inputBackground,
//         justifyContent: 'center',
//         alignItems: 'center',
//         overflow: 'hidden',
//     },
//     reviewerAvatarImage: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//     },
//     avatarText: {
//         fontSize: TYPOGRAPHY.fontSize.md,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         color: COLORS.textSecondary,
//     },
//     elementName: {
//         fontSize: TYPOGRAPHY.fontSize.md,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         color: COLORS.textPrimary,
//     },
//     reviewDate: {
//         fontSize: TYPOGRAPHY.fontSize.xs,
//         color: COLORS.textLight,
//     },
//     ratingBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: COLORS.success,
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: BORDER_RADIUS.sm,
//         gap: 4,
//     },
//     ratingBadgeText: {
//         fontSize: TYPOGRAPHY.fontSize.xs,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         color: COLORS.white,
//     },
//     reviewText: {
//         fontSize: TYPOGRAPHY.fontSize.md,
//         color: COLORS.textSecondary,
//         lineHeight: 22,
//     },
//     noReviews: {
//         alignItems: 'center',
//         paddingVertical: SPACING.xxl,
//         gap: SPACING.sm,
//     },
//     noReviewsText: {
//         fontSize: TYPOGRAPHY.fontSize.md,
//         color: COLORS.textLight,
//     },
//     bottomBar: {
//         backgroundColor: COLORS.white,
//         borderTopWidth: 1,
//         borderTopColor: COLORS.divider,
//         ...SHADOWS.heavy,
//     },
//     bottomBarContent: {
//         flexDirection: 'row',
//         padding: SPACING.lg,
//         gap: SPACING.md,
//     },
//     cartButton: {
//         width: 56,
//         height: 56,
//         borderRadius: BORDER_RADIUS.xl,
//         backgroundColor: COLORS.inputBackground,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: COLORS.border,
//     },
//     cartIconWrapper: {
//         position: 'relative',
//     },
//     badge: {
//         position: 'absolute',
//         top: -8,
//         right: -8,
//         backgroundColor: COLORS.primary,
//         width: 18,
//         height: 18,
//         borderRadius: 9,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 2,
//         borderColor: COLORS.white,
//     },
//     badgeText: {
//         fontSize: 10,
//         fontWeight: 'bold',
//         color: COLORS.white,
//     },
//     bookButton: {
//         flex: 1,
//         backgroundColor: COLORS.textPrimary,
//         borderRadius: BORDER_RADIUS.xl,
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: 56,
//     },
//     bookButtonText: {
//         fontSize: TYPOGRAPHY.fontSize.lg,
//         fontWeight: TYPOGRAPHY.fontWeight.bold,
//         color: COLORS.white,
//     },
// });

// export default ServiceDetailsScreen;












import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Share,
    FlatList,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchServiceById, clearSelectedService } from '../../store/slices/servicesSlice';
import { addToCart, updateQuantity, removeFromCart } from '../../store/slices/cartSlice';
import { addToFavorites, removeFromFavorites } from '../../store/slices/favoritesSlice';
import { servicesApi } from '../../api/client';
import { useAuthGate } from '../../hooks/useAuthGate';
import ServiceDetailsSkeleton from '../../components/skeletons/ServiceDetailsSkeleton';
import type { HomeStackParamList } from '../../navigation/MainNavigator';
import type { Review } from '../../types';

type ServiceDetailsRouteProp = RouteProp<HomeStackParamList, 'ServiceDetails'>;
type ServiceDetailsNavigationProp = StackNavigationProp<HomeStackParamList, 'ServiceDetails'>;

const { width } = Dimensions.get('window');

const ServiceDetailsScreen: React.FC = () => {
    const navigation = useNavigation<ServiceDetailsNavigationProp>();
    const route = useRoute<ServiceDetailsRouteProp>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { requireAuth } = useAuthGate();

    const { serviceId } = route.params;
    const { selectedService: service, loading } = useAppSelector((state) => state.services);
    const cartItems = useAppSelector((state) => state.cart.items);
    const favoriteIds = useAppSelector((state) => state.favorites.favoriteIds);

    const cartItem = cartItems.find(item => item.service.id === serviceId);
    const quantityInCart = cartItem?.quantity || 0;
    const isFavorite = favoriteIds.includes(serviceId);

    // Metadata
    const metadata = service?.metadata;

    // Reviews state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const images = service?.imageUrls?.length 
        ? service.imageUrls 
        : (service?.imageUrl ? [service.imageUrl] : []);

    // Variants
    const variants = (metadata as any)?.variants as Record<string, any> | undefined;
    const variantEntries = variants ? Object.entries(variants) : [];
    const selectedVariant = selectedVariantId && variants ? variants[selectedVariantId] : null;

    useEffect(() => {
        dispatch(fetchServiceById(serviceId));
        return () => {
            dispatch(clearSelectedService());
        };
    }, [serviceId, dispatch]);

    // Fetch reviews
    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true);
        try {
            const { data: responseData } = await servicesApi.getServiceReviews(serviceId, 1, 5);
            const payload = responseData?.data || responseData;
            setReviews(Array.isArray(payload) ? payload : (payload?.reviews || []));
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setReviewsLoading(false);
        }
    }, [serviceId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleAddToCart = () => {
        if (service) {
            dispatch(addToCart({ 
                service, 
                quantity: 1, 
                selectedOptions: selectedVariantId ? { variantId: selectedVariantId } : undefined 
            }));
        }
    };

    const handleBookNow = () => {
        if (service) {
            dispatch(addToCart({ 
                service, 
                quantity: 1, 
                selectedOptions: selectedVariantId ? { variantId: selectedVariantId } : undefined 
            }));
            navigation.getParent()?.navigate('CartTab');
        }
    };

    const handleToggleFavorite = () => {
        requireAuth(() => {
            if (!service) return;
            if (isFavorite) {
                dispatch(removeFromFavorites(serviceId));
            } else {
                dispatch(addToFavorites(service));
            }
        }, 'ServiceDetails', { serviceId });
    };

    const handleShare = async () => {
        if (!service) return;
        try {
            await Share.share({
                title: service.title,
                message: `Check out ${service.title} on Servanza! Starting at ${formatCurrency(service.basePrice)}`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    // Computed values (variant-aware)
    const displayPrice = selectedVariant?.price ?? service?.basePrice ?? 0;
    const displayDuration = selectedVariant?.durationMins ?? service?.durationMins ?? 0;
    
    // Parse description object
    const descObj = service?.description || {};
    const displayDescription = typeof descObj === 'string' ? descObj : (descObj.description || '');
    
    // Helper function to safely parse comma-separated strings OR arrays containing comma-separated strings
    const parseStringToArray = (data: any): string[] => {
        // Case 1: If it's a direct string like "Item 1, Item 2"
        if (typeof data === 'string') {
            return data
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
        }
        
        // Case 2: If it's an array like ["Item 1, Item 2", "Item 3"]
        if (Array.isArray(data)) {
            return data
                .flatMap(item => 
                    typeof item === 'string' 
                        ? item.split(',').map(str => str.trim()) // Split inner strings
                        : item
                )
                .filter(item => typeof item === 'string' && item.length > 0);
        }
        
        return [];
    };

    // Arrays correctly typed and parsed
    const whatsIncluded: string[] = typeof descObj === 'object' ? parseStringToArray(descObj.whatsIncluded) : [];
    const whatsNotIncluded: string[] = typeof descObj === 'object' ? parseStringToArray(descObj.whatsNotIncluded) : [];
    const productsWeUse: string[] = typeof descObj === 'object' ? parseStringToArray(descObj.productsWeUse) : [];
    const productsNeeded: string[] = typeof descObj === 'object' ? parseStringToArray(descObj.productsNeededFromCustomer) : [];

    const avgRating = service?.averageRating;
    const totalReviews = service?.totalReviews || 0;

    const getTimeAgo = (dateStr: string) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diffMs = now.getTime() - d.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    };

    if (loading || !service) {
        return <ServiceDetailsSkeleton />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    {images.length > 0 ? (
                        <>
                            <FlatList
                                horizontal
                                pagingEnabled
                                data={images}
                                keyExtractor={(_, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <Image source={{ uri: item }} style={[styles.image, { width }]} />
                                )}
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                    setActiveImage(index);
                                }}
                            />
                            {images.length > 1 && (
                                <View style={styles.imageDots}>
                                    {images.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.imageDot,
                                                i === activeImage && styles.imageDotActive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="construct" size={60} color={COLORS.textLight} />
                        </View>
                    )}

                    {/* Header Buttons Overlay */}
                    <View style={[styles.headerOverlay, { paddingTop: insets.top + SPACING.sm }]}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
                                <Ionicons
                                    name={isFavorite ? "heart" : "heart-outline"}
                                    size={24}
                                    color={isFavorite ? COLORS.error : COLORS.textPrimary}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                                <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <View style={styles.headerSection}>
                        <View style={styles.titleRow}>
                            <View style={styles.categoryTag}>
                                <Text style={styles.categoryText}>
                                    {service.category?.name || 'Service'}
                                </Text>
                            </View>
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={16} color={COLORS.star} />
                                <Text style={styles.ratingText}>
                                    {avgRating ? `${avgRating} (${totalReviews} reviews)` : 'New'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.title}>{service.title}</Text>

                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
                            <View style={styles.dot} />
                            <View style={styles.durationContainer}>
                                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                                <Text style={styles.durationText}>{displayDuration} mins</Text>
                            </View>
                        </View>

                        {/* Variant Selector */}
                        {variantEntries.length > 0 && (
                            <View style={{ marginTop: SPACING.md }}>
                                <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.bold as any, color: COLORS.textSecondary, marginBottom: SPACING.sm }}>Select Duration</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
                                    {variantEntries.map(([vId, variant]: [string, any]) => {
                                        const isSelected = selectedVariantId === vId;
                                        return (
                                            <TouchableOpacity
                                                key={vId}
                                                onPress={() => setSelectedVariantId(isSelected ? null : vId)}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 10,
                                                    backgroundColor: isSelected ? COLORS.primary : COLORS.white,
                                                    borderRadius: BORDER_RADIUS.lg,
                                                    borderWidth: 1,
                                                    borderColor: isSelected ? COLORS.primary : COLORS.border,
                                                    minWidth: 90,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: TYPOGRAPHY.fontSize.sm,
                                                    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
                                                    color: isSelected ? COLORS.white : COLORS.textPrimary,
                                                }}>
                                                    {variant.label || vId}
                                                </Text>
                                                <Text style={{
                                                    fontSize: TYPOGRAPHY.fontSize.xs,
                                                    color: isSelected ? 'rgba(255,255,255,0.8)' : COLORS.textSecondary,
                                                    marginTop: 2,
                                                }}>
                                                    {variant.durationMins} mins • {formatCurrency(variant.price)}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* About */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About this service</Text>
                        <Text style={styles.description} numberOfLines={showDescription ? undefined : 4}>
                            {displayDescription || 'Professional service with verified experts.'}
                        </Text>
                        {displayDescription.length > 150 && (
                            <TouchableOpacity onPress={() => setShowDescription(!showDescription)}>
                                <Text style={styles.readMoreText}>
                                    {showDescription ? 'Show less' : 'Read more'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* What's Included */}
                    {whatsIncluded.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>What's included</Text>
                            <View style={styles.featuresList}>
                                {whatsIncluded.map((feature: string, index: number) => (
                                    <View key={index} style={styles.featureItem}>
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="checkmark" size={12} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* What's Not Included */}
                    {whatsNotIncluded.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>What's not included</Text>
                            <View style={styles.featuresList}>
                                {whatsNotIncluded.map((feature: string, index: number) => (
                                    <View key={index} style={styles.featureItem}>
                                        <View style={styles.excludeIcon}>
                                            <Ionicons name="close" size={12} color={COLORS.textLight} />
                                        </View>
                                        <Text style={[styles.featureText, { color: COLORS.textLight }]}>
                                            {feature}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Products We Use */}
                    {productsWeUse.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Products We Use</Text>
                            <View style={styles.featuresList}>
                                {productsWeUse.map((feature: string, index: number) => (
                                    <View key={index} style={styles.featureItem}>
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="flask" size={12} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Products Needed from Customer */}
                    {productsNeeded.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Things We Need From You</Text>
                            <View style={styles.featuresList}>
                                {productsNeeded.map((feature: string, index: number) => (
                                    <View key={index} style={styles.featureItem}>
                                        <View style={[styles.checkIcon, { backgroundColor: COLORS.warning || '#F59E0B' }]}>
                                            <Ionicons name="basket" size={12} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Reviews Preview */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Reviews</Text>
                            {totalReviews > 0 && (
                                <TouchableOpacity>
                                    <Text style={styles.seeAllText}>See all</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {reviewsLoading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 20 }} />
                        ) : reviews.length > 0 ? (
                            <FlatList
                                data={reviews.slice(0, 3)}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => String(item.id)}
                                contentContainerStyle={{ gap: SPACING.md }}
                                renderItem={({ item }) => {
                                    const initials = item.user?.name
                                        ? item.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                        : '??';
                                    return (
                                        <View style={styles.reviewCard}>
                                            <View style={styles.reviewHeader}>
                                                <View style={styles.reviewerInfo}>
                                                    <View style={styles.reviewerAvatar}>
                                                        {item.user?.profileImage ? (
                                                            <Image
                                                                source={{ uri: item.user.profileImage }}
                                                                style={styles.reviewerAvatarImage}
                                                            />
                                                        ) : (
                                                            <Text style={styles.avatarText}>{initials}</Text>
                                                        )}
                                                    </View>
                                                    <View>
                                                        <Text style={styles.elementName}>
                                                            {item.user?.name || 'Anonymous'}
                                                        </Text>
                                                        <Text style={styles.reviewDate}>
                                                            {getTimeAgo(item.createdAt)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                {item.rating !== null && item.rating !== undefined && (
                                                <View style={styles.ratingBadge}>
                                                    <Text style={styles.ratingBadgeText}>
                                                        {item.rating.toFixed(1)}
                                                    </Text>
                                                    <Ionicons name="star" size={10} color={COLORS.white} />
                                                </View>
                                                )}
                                            </View>
                                            {item.comment && (
                                                <Text style={styles.reviewText} numberOfLines={3}>
                                                    {item.comment}
                                                </Text>
                                            )}
                                        </View>
                                    );
                                }}
                            />
                        ) : (
                            <View style={styles.noReviews}>
                                <Ionicons name="chatbubble-outline" size={32} color={COLORS.textLight} />
                                <Text style={styles.noReviewsText}>No reviews yet</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
                <View style={styles.bottomBarContent}>
                    {quantityInCart > 0 ? (
                        <>
                            <View style={styles.quantitySelector}>
                                <TouchableOpacity 
                                    style={styles.qtyButton} 
                                    onPress={() => {
                                        if (quantityInCart === 1) {
                                            dispatch(removeFromCart(serviceId));
                                        } else {
                                            dispatch(updateQuantity({ serviceId, quantity: quantityInCart - 1 }));
                                        }
                                    }}
                                >
                                    <Ionicons 
                                        name={quantityInCart === 1 ? "trash-outline" : "remove"} 
                                        size={20} 
                                        color={quantityInCart === 1 ? COLORS.error : COLORS.textPrimary} 
                                    />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{quantityInCart}</Text>
                                <TouchableOpacity 
                                    style={styles.qtyButton} 
                                    onPress={() => {
                                        dispatch(updateQuantity({ serviceId, quantity: quantityInCart + 1 }));
                                    }}
                                >
                                    <Ionicons name="add" size={20} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => navigation.getParent()?.navigate('CartTab')}
                            >
                                <Text style={styles.bookButtonText}>View Cart</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.cartButton}
                                onPress={handleAddToCart}
                            >
                                <View style={styles.cartIconWrapper}>
                                    <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={handleBookNow}
                            >
                                <Text style={styles.bookButtonText}>Book Now</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </SafeAreaView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        height: 300,
        backgroundColor: COLORS.inputBackground,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
    },
    imageDots: {
        position: 'absolute',
        bottom: SPACING.xl,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    imageDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    imageDotActive: {
        width: 24,
        backgroundColor: COLORS.white,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
    },
    headerRight: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.light,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        marginTop: -30,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xxl,
    },
    headerSection: {
        marginBottom: SPACING.xl,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    categoryTag: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    categoryText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        textTransform: 'uppercase',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.hero,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    price: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.textLight,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    durationText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginBottom: SPACING.xl,
    },
    section: {
        marginBottom: SPACING.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    seeAllText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    description: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    readMoreText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        marginTop: SPACING.xs,
    },
    featuresList: {
        gap: SPACING.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.white,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    checkIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    excludeIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    reviewCard: {
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        width: 280,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    reviewerInfo: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    reviewerAvatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
    },
    elementName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    reviewDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
        gap: 4,
    },
    ratingBadgeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
    reviewText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    noReviews: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        gap: SPACING.sm,
    },
    noReviewsText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
    },
    bottomBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        ...SHADOWS.heavy,
    },
    bottomBarContent: {
        flexDirection: 'row',
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    cartButton: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.inputBackground,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cartIconWrapper: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.primary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    bookButton: {
        flex: 1,
        backgroundColor: COLORS.textPrimary,
        borderRadius: BORDER_RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
    },
    bookButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.inputBackground,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        width: 140,
        height: 56,
        paddingHorizontal: SPACING.xs,
    },
    qtyButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        ...SHADOWS.light,
    },
    qtyText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        textAlign: 'center',
        flex: 1,
    },
});

export default ServiceDetailsScreen;