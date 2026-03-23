import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Constants from 'expo-constants';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { selectUser } from "../../store/authSlice";
import {
  useGetCommentsByReelQuery,
  useCreateCommentMutation,
  useToggleCommentLikeMutation,
  commentsApi,
} from "../../services/commentsApi";
import { reelsApi } from "../../services/reelsApi";
import styles from "../../assets/styles/comments.styles";
import COLORS from "../../constants/colors";

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "now";
  
  try {
    const now = new Date();
    const commentDate = new Date(timestamp);
    
    // Check if the date is valid
    if (isNaN(commentDate.getTime())) {
      return "now";
    }
    
    const diffInSeconds = Math.floor((now - commentDate) / 1000);
    
    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}w`;
    return `${Math.floor(diffInSeconds / 31536000)}y`;
  } catch (error) {
    return "now";
  }
};

// Helper function to safely get profile image source (handles null, undefined, empty strings)
const getProfileImageSource = (profileImage) => {
  // Check if profileImage is a valid non-empty string that starts with http
  if (
    profileImage &&
    typeof profileImage === 'string' &&
    profileImage.trim() !== '' &&
    (profileImage.startsWith('http://') || profileImage.startsWith('https://'))
  ) {
    return { uri: profileImage };
  }
  
  // Fallback to default image for null, undefined, empty strings, or invalid URLs
  return require("../../assets/images/userProfileImg.jpg");
};

// Helper function to transform API comment to UI format
const transformComment = (apiComment) => {
  return {
    id: apiComment._id,
    username: apiComment.userId?.name || apiComment.userId?.username || "Unknown User",
    profileImage: apiComment.userId?.profileImage,
    comment: apiComment.content,
    timestamp: apiComment.createdAt, // Store raw timestamp, format during render
    likes: apiComment.likes?.length || 0,
    isLiked: apiComment.likes?.some(like => like._id === apiComment.userId?._id) || false,
    isVerified: apiComment.userId?.isVerified || false,
    replies: apiComment.replies?.map(transformComment) || [],
    parentId: apiComment.parentCommentId,
    createdAt: apiComment.createdAt,
    updatedAt: apiComment.updatedAt,
  };
};

export default function CommentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const insets = useSafeAreaInsets();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  // Extract reelId properly - handle array case
  const reelId = useMemo(() => {
    const rawReelId = params?.reelId;
    if (Array.isArray(rawReelId)) {
      return rawReelId[0];
    }
    if (typeof rawReelId === 'string' && rawReelId.trim().length > 0) {
      return rawReelId.trim();
    }
    return undefined;
  }, [params?.reelId]);

  // API hooks
  const shouldSkipQuery = !reelId || !user;
  const { data: commentsData, isLoading, error, refetch, isFetching } = useGetCommentsByReelQuery(
    { reelId, page: 1, limit: 50 },
    { 
      skip: shouldSkipQuery, // Skip if no reelId or user not authenticated
    }
  );

  // Add timeout to detect stuck loading state
  const [isTimedOut, setIsTimedOut] = useState(false);
  useEffect(() => {
    if (isLoading && reelId && user) {
      const timeout = setTimeout(() => {
        setIsTimedOut(true);
      }, 10000); // 10 second timeout
      return () => clearTimeout(timeout);
    } else {
      setIsTimedOut(false);
    }
  }, [isLoading, reelId, user]);


  const [createComment, { isLoading: isCreatingComment }] = useCreateCommentMutation();
  const [toggleLike, { isLoading: isTogglingLike }] = useToggleCommentLikeMutation();

  // Local state
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [replyingToUser, setReplyingToUser] = useState(null);
  const inputRef = useRef(null);
  const replyInputRef = useRef(null);
  const flatListRef = useRef(null);

  // Transform API data to UI format - memoized to prevent infinite re-renders
  const comments = useMemo(() => {
    const transformedComments = commentsData?.data?.comments?.map(transformComment) || [];
    
    // Sort by likes desc
    const sorted = [...transformedComments].sort((a, b) => {
      const aLikes = typeof a.likes === 'number' ? a.likes : 0;
      const bLikes = typeof b.likes === 'number' ? b.likes : 0;
      return bLikes - aLikes;
    });
    
    return sorted;
  }, [commentsData?.data?.comments]);

  const handleLikeComment = useCallback(async (commentId) => {
    try {
      // Optimistic update - immediately update the cache
      dispatch(
        commentsApi.util.updateQueryData(
          'getCommentsByReel',
          { reelId, page: 1, limit: 50 },
          (draft) => {
            if (draft?.data?.comments) {
              // Update the main comment
              const updateComment = (comments) => {
                return comments.map(comment => {
                  if (comment._id === commentId) {
                    const isLiked = comment.likes?.some(like => like._id === user.id);
                    if (isLiked) {
                      // Unlike
                      return {
                        ...comment,
                        likes: comment.likes.filter(like => like._id !== user.id)
                      };
                    } else {
                      // Like
                      return {
                        ...comment,
                        likes: [...(comment.likes || []), { _id: user.id }]
                      };
                    }
                  }
                  // Update replies recursively
                  if (comment.replies && comment.replies.length > 0) {
                    return {
                      ...comment,
                      replies: updateComment(comment.replies)
                    };
                  }
                  return comment;
                });
              };
              
              draft.data.comments = updateComment(draft.data.comments);
            }
          }
        )
      );

      // Make the API call
      await toggleLike(commentId).unwrap();
      
      // Refetch to ensure data consistency
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to like/unlike comment');
      // Refetch on error to revert optimistic update
      refetch();
    }
  }, [toggleLike, dispatch, reelId, user.id, refetch]);


  const handleAddComment = useCallback(async () => {
    if (newComment.trim() === "" || isCreatingComment) return;

    try {
      await createComment({
        reelId,
        content: newComment.trim(),
      }).unwrap();
      
      // Invalidate reels cache to update comment count in real-time
      dispatch(reelsApi.util.invalidateTags(["Reels", "UserReels"]));
      
      setNewComment("");
      // Scroll to top to show new comment
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  }, [createComment, reelId, newComment, isCreatingComment, dispatch]);

  const handleReply = useCallback((commentId, username = null) => {
    setReplyingTo(commentId);
    setReplyingToUser(username);
    setReplyText("");
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 200);
  }, []);

  // Helper function to add reply to nested structure - memoized
  const addReplyToComment = useCallback((comments, targetId, newReply) => {
    return comments.map((comment) => {
      if (comment.id === targetId) {
        return { ...comment, replies: [...comment.replies, newReply] };
      }
      if (comment.replies && comment.replies.length > 0) {
        const updatedReplies = addReplyToComment(comment.replies, targetId, newReply);
        if (updatedReplies !== comment.replies) {
          return { ...comment, replies: updatedReplies };
        }
      }
      return comment;
    });
  }, []);

  // Helper function to find the root comment ID for any nested reply - memoized
  const findRootCommentId = useCallback((comments, targetId) => {
    for (const comment of comments) {
      if (comment.id === targetId) {
        return comment.id;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findRootCommentId(comment.replies, targetId);
        if (found) {
          return comment.id.includes('_') ? findRootCommentId(comments, comment.parentId || comment.id.split('_')[0]) : comment.id;
        }
      }
    }
    return null;
  }, []);

  const handleAddReply = useCallback(async () => {
    if (replyText.trim() === "" || !replyingTo || isCreatingComment) return;

    try {
      const content = replyingToUser ? `@${replyingToUser} ${replyText.trim()}` : replyText.trim();
      
      await createComment({
        reelId,
        content,
        parentCommentId: replyingTo,
      }).unwrap();

      // Invalidate reels cache to update comment count in real-time
      dispatch(reelsApi.util.invalidateTags(["Reels", "UserReels"]));

      // Find and expand the root comment to show the new reply
      const rootCommentId = findRootCommentId(comments, replyingTo);
      if (rootCommentId) {
        setExpandedReplies((prev) => new Set([...prev, rootCommentId]));
      }

      setReplyText("");
      setReplyingTo(null);
      setReplyingToUser(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add reply');
    }
  }, [replyText, replyingTo, isCreatingComment, replyingToUser, createComment, reelId, findRootCommentId, comments, dispatch]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
    setReplyText("");
    setReplyingToUser(null);
    // Blur any focused inputs
    replyInputRef.current?.blur();
    inputRef.current?.blur();
  }, []);

  const toggleReplies = useCallback((commentId) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // Remove the old formatTimestamp function since we have a new one above

  // Helper function to count total replies recursively - memoized
  const countTotalReplies = useCallback((replies) => {
    let count = replies.length;
    replies.forEach(reply => {
      if (reply.replies && reply.replies.length > 0) {
        count += countTotalReplies(reply.replies);
      }
    });
    return count;
  }, []);

  // Recursive function to render nested replies - memoized
  const renderNestedReply = useCallback((reply, depth = 0) => {
    const isLiked = reply.isLiked;
    const likeCount = reply.likes;
    const hasReplies = reply.replies && reply.replies.length > 0;
    const isReplying = replyingTo === reply.id;
    const maxDepth = 3; // Limit nesting depth

    return (
      <View key={reply.id} style={[styles.replyItem, { marginLeft: depth * 16 }]}>
        <View style={styles.replyHeader}>
          <Image
            source={getProfileImageSource(reply.profileImage)}
            style={[styles.replyProfileImage, { 
              width: Math.max(20, 24 - depth * 2), 
              height: Math.max(20, 24 - depth * 2),
              borderRadius: Math.max(10, 12 - depth) 
            }]}
            defaultSource={require("../../assets/images/userProfileImg.jpg")}
          />
          <View style={styles.replyInfo}>
            <View style={styles.replyUsernameRow}>
              <Text style={[styles.replyUsername, { fontSize: Math.max(10, 12 - depth * 0.5) }]}>
                {reply.username}
              </Text>
              {reply.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={Math.max(10, 14 - depth)}
                  color={COLORS.primary}
                  style={styles.replyVerifiedIcon}
                />
              )}
            </View>
            <Text style={[styles.replyTimestamp, { fontSize: Math.max(8, 10 - depth * 0.5) }]}>
              {formatTimestamp(reply.timestamp)}
            </Text>
          </View>
          <View style={styles.replyLikeSection}>
            <TouchableOpacity
              onPress={() => handleLikeComment(reply.id)}
              style={[
                styles.replyLikeButton,
                isLiked && { backgroundColor: COLORS.background }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={Math.max(12, 16 - depth)}
                color={isLiked ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
            {likeCount > 0 && (
              <Text style={[styles.replyLikeCount, { fontSize: Math.max(8, 10 - depth * 0.5) }]}>
                {likeCount}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.replyContent}>
          <Text style={[styles.replyText, { fontSize: Math.max(11, 14 - depth * 0.5) }]}>
            {reply.comment}
          </Text>
          
          <View style={styles.replyActions}>
            <TouchableOpacity 
              style={styles.replyActionButton}
              onPress={() => handleReply(reply.id, reply.username)}
              activeOpacity={0.7}
            >
              <Text style={[styles.replyActionText, { fontSize: Math.max(10, 12 - depth * 0.5) }]}>
                Reply
              </Text>
            </TouchableOpacity>
            
            {hasReplies && depth < maxDepth && (
              <TouchableOpacity 
                style={styles.replyActionButton}
                onPress={() => toggleReplies(reply.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewRepliesText, { fontSize: Math.max(10, 12 - depth * 0.5) }]}>
                  {expandedReplies.has(reply.id) ? 
                    "Hide" : 
                    `View ${reply.replies.length} ${reply.replies.length === 1 ? 'reply' : 'replies'}`
                  }
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Nested reply input */}
        {isReplying && (
          <View style={[styles.nestedReplyInput, { marginLeft: 8 }]}>
            <View style={styles.replyInputRow}>
              <Image
                source={
                  user?.profileImage && typeof user?.profileImage === 'string' && user?.profileImage.startsWith('http')
                    ? { uri: user.profileImage }
                    : require("../../assets/images/userProfileImg.jpg")
                }
                style={[styles.replyUserImage, { width: 20, height: 20, borderRadius: 10 }]}
                defaultSource={require("../../assets/images/userProfileImg.jpg")}
              />
              <TextInput
                style={[styles.replyInput, { fontSize: 12 }]}
                placeholder={`Reply to ${reply.username}...`}
                placeholderTextColor={COLORS.textSecondary}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleAddReply}
                autoFocus={false}
              />
              <TouchableOpacity
                style={[styles.replySendButton, { opacity: replyText.trim() ? 1 : 0.5 }]}
                onPress={handleAddReply}
                disabled={!replyText.trim()}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={16} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.replyCancelButton}
                onPress={handleCancelReply}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Nested replies */}
        {hasReplies && expandedReplies.has(reply.id) && depth < maxDepth && (
          <View style={styles.nestedRepliesContainer}>
            {reply.replies.map((nestedReply) => renderNestedReply(nestedReply, depth + 1))}
          </View>
        )}
      </View>
    );
  }, [handleLikeComment, handleReply, toggleReplies, expandedReplies, replyingTo, user, replyText, handleAddReply, handleCancelReply]);

  const renderComment = useCallback(({ item }) => {
    const isLiked = item.isLiked;
    const likeCount = item.likes;
    const hasReplies = item.replies && item.replies.length > 0;
    const totalReplies = hasReplies ? countTotalReplies(item.replies) : 0;
    const isExpanded = expandedReplies.has(item.id);
    const isReplying = replyingTo === item.id;

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <Image
            source={getProfileImageSource(item.profileImage)}
            style={styles.profileImage}
            defaultSource={require("../../assets/images/userProfileImg.jpg")}
          />
          <View style={styles.commentInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{item.username}</Text>
              {item.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.primary}
                  style={styles.verifiedIcon}
                />
              )}
              {item.reactionImage && (
                <Image
                  source={{ uri: item.reactionImage }}
                  style={styles.reactionImage}
                />
              )}
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>
          <View style={styles.likeSection}>
            <TouchableOpacity
              onPress={() => handleLikeComment(item.id)}
              style={[
                styles.likeButton,
                isLiked && { backgroundColor: COLORS.background }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={18}
                color={isLiked ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
            {likeCount > 0 && (
              <Text style={styles.likeCount}>{likeCount}</Text>
            )}
          </View>
        </View>

        <View style={styles.commentContent}>
          <Text style={styles.commentText}>{item.comment}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.replyButton}
              onPress={() => handleReply(item.id, item.username)}
              activeOpacity={0.7}
            >
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
            {hasReplies && (
              <TouchableOpacity 
                style={styles.viewRepliesButton}
                onPress={() => toggleReplies(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewRepliesText}>
                  {isExpanded ? "Hide" : `View ${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reply Input */}
        {isReplying && (
          <View style={styles.replyInputContainer}>
            <View style={styles.replyInputRow}>
              <Image
                source={getProfileImageSource(user?.profileImage)}
                style={styles.replyUserImage}
                defaultSource={require("../../assets/images/userProfileImg.jpg")}
              />
              <TextInput
                ref={replyInputRef}
                style={styles.replyInput}
                placeholder={`Reply to ${item.username}...`}
                placeholderTextColor={COLORS.textSecondary}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleAddReply}
                autoFocus={false}
              />
                             <TouchableOpacity
                 style={[styles.replySendButton, { opacity: replyText.trim() && !isCreatingComment ? 1 : 0.5 }]}
                 onPress={handleAddReply}
                 disabled={!replyText.trim() || isCreatingComment}
                 activeOpacity={0.7}
               >
                 {isCreatingComment ? (
                   <ActivityIndicator size="small" color={COLORS.white} />
                 ) : (
                   <Ionicons name="send" size={18} color={COLORS.white} />
                 )}
               </TouchableOpacity>
              <TouchableOpacity
                style={styles.replyCancelButton}
                onPress={handleCancelReply}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Replies */}
        {hasReplies && isExpanded && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => renderNestedReply(reply, 0))}
          </View>
        )}
      </View>
    );
  }, [handleLikeComment, handleReply, toggleReplies, expandedReplies, replyingTo, user, replyText, handleAddReply, handleCancelReply, renderNestedReply, countTotalReplies]);


  // Show authentication required state
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={50} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
            Login Required
          </Text>
          <Text style={{ marginTop: 8, color: COLORS.textSecondary, textAlign: 'center', fontSize: 14 }}>
            Please login to view and add comments
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if reelId is missing
  if (!reelId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
            Invalid Reel ID
          </Text>
          <Text style={{ marginTop: 8, color: COLORS.textSecondary, textAlign: 'center', fontSize: 14 }}>
            Unable to load comments. Please try again.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state first (before timeout)
  if (error && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
            Failed to load comments
          </Text>
          <Text style={{ marginTop: 8, color: COLORS.textSecondary, textAlign: 'center', fontSize: 12 }}>
            {error?.status === 401 ? 'Please login to view comments' : 
             error?.status === 404 ? 'Reel not found' :
             error?.data?.message || error?.error || 'Network error'}
          </Text>
          <Text style={{ marginTop: 4, color: COLORS.textSecondary, textAlign: 'center', fontSize: 10 }}>
            {error?.status === 0 ? 'Check if backend server is running' : ''}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}
            onPress={() => refetch()}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state - only show if actually loading (not skipped)
  // Also check if query is actually running (not skipped)
  const isQueryRunning = !shouldSkipQuery && (isLoading || isFetching);
  if (isQueryRunning && !isTimedOut) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>Loading comments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show timeout error if loading takes too long
  if (isTimedOut) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="time-outline" size={64} color={COLORS.textSecondary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
            Request Timeout
          </Text>
          <Text style={{ marginTop: 8, color: COLORS.textSecondary, textAlign: 'center', fontSize: 14 }}>
            Loading comments is taking too long. Please check your connection and try again.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}
            onPress={() => {
              setIsTimedOut(false);
              refetch();
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
     >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        

        {/* Comments List */}
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            ...styles.commentsContent,
            paddingBottom: (styles?.inputContainer?.paddingVertical || 12) + 120 + (insets.bottom || 0),
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }}>
                Be the first to comment!
              </Text>
            </View>
          }
        />

        {/* Input Section */}
        <View style={[
          styles.inputContainer,
          { paddingBottom: 20 + (insets.bottom || 0) }
        ]}>

                     {replyingTo && (
             <View style={styles.replyingToContainer}>
               <Text style={styles.replyingToText}>
                 Replying to {replyingToUser || "comment"}
               </Text>
               <TouchableOpacity onPress={handleCancelReply}>
                 <Ionicons name="close" size={16} color={COLORS.textSecondary} />
               </TouchableOpacity>
             </View>
           )}
           <View style={styles.inputRow}>
             <Image
               source={getProfileImageSource(user?.profileImage)}
               style={styles.userProfileImage}
               defaultSource={require("../../assets/images/userProfileImg.jpg")}
             />
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder={replyingTo ? "Write a reply..." : "What do you think of this?"}
              placeholderTextColor={COLORS.textSecondary}
              value={replyingTo ? replyText : newComment}
              onChangeText={replyingTo ? setReplyText : setNewComment}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={replyingTo ? handleAddReply : handleAddComment}
              autoFocus={false}
            />
            <TouchableOpacity
                style={[
                  styles.attachButton,
                  { 
                    opacity: (replyingTo ? replyText.trim() : newComment.trim()) && !isCreatingComment ? 1 : 0.5 
                  }
                ]}
                onPress={replyingTo ? handleAddReply : handleAddComment}
                disabled={!(replyingTo ? replyText.trim() : newComment.trim()) || isCreatingComment}
                activeOpacity={0.7}
              >
                {isCreatingComment ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="send" size={20} color={COLORS.white} />
                )}
              </TouchableOpacity>
           </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}